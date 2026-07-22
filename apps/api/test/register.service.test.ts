import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common";
import { address as toAddress, getBase64Encoder, getTransactionDecoder } from "@solana/kit";
import { deriveTagPda } from "@tip/core";
import type { PrismaClient } from "@tip/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { InsufficientBalanceException } from "../src/register/insufficient-balance.exception.js";
import { RegisterService } from "../src/register/register.service.js";
import { generateTestKeypair } from "./helpers/keypair.js";

const PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
const OWNER = generateTestKeypair().pubkeyBase58;
const OTHER_WALLET = generateTestKeypair().pubkeyBase58;

function makeFakeDb(existingRow: unknown = null) {
  return {
    identity: {
      findUnique: vi.fn().mockResolvedValue(existingRow),
    },
  } as unknown as PrismaClient;
}

function makeFakeRpc(overrides: { balance?: bigint; fee?: bigint | null; rentExempt?: bigint } = {}) {
  return {
    getLatestBlockhash: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue({
        value: { blockhash: toAddress("11111111111111111111111111111111"), lastValidBlockHeight: 1000n },
      }),
    }),
    getMinimumBalanceForRentExemption: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue(overrides.rentExempt ?? 1_000_000n),
    }),
    getFeeForMessage: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue({ value: overrides.fee === undefined ? 5000n : overrides.fee }),
    }),
    getBalance: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue({ value: overrides.balance ?? 10_000_000n }),
    }),
  };
}

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.TIP_REGISTRY_PROGRAM_ID = PROGRAM_ID;
  return new ConfigService();
}

describe("RegisterService", () => {
  let config: ConfigService;

  beforeEach(() => {
    config = makeConfigService();
  });

  it("rejects a non-canonical tag with 400", async () => {
    const service = new RegisterService(makeFakeDb(), makeFakeRpc() as never, config);

    await expect(
      service.register({ rawTag: "ab", wallet: undefined, ownerPubkey: OWNER }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects an already-registered tag with 409", async () => {
    const service = new RegisterService(makeFakeDb({ status: "active" }), makeFakeRpc() as never, config);

    await expect(
      service.register({ rawTag: "daniel", wallet: undefined, ownerPubkey: OWNER }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects a reserved name", async () => {
    const service = new RegisterService(makeFakeDb(), makeFakeRpc() as never, config);

    await expect(
      service.register({ rawTag: "admin", wallet: undefined, ownerPubkey: OWNER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects an inappropriate name", async () => {
    const service = new RegisterService(makeFakeDb(), makeFakeRpc() as never, config);

    await expect(
      service.register({ rawTag: "fuck", wallet: undefined, ownerPubkey: OWNER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects an invalid wallet address", async () => {
    const service = new RegisterService(makeFakeDb(), makeFakeRpc() as never, config);

    await expect(
      service.register({ rawTag: "freshtag", wallet: "not-a-valid-address", ownerPubkey: OWNER }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("uses the JWT pubkey as owner and fee payer, and the transaction is unsigned", async () => {
    const service = new RegisterService(makeFakeDb(), makeFakeRpc() as never, config);

    const result = await service.register({ rawTag: "freshtag", wallet: undefined, ownerPubkey: OWNER });

    const wireBytes = getBase64Encoder().encode(result.transaction);
    const decoded = getTransactionDecoder().decode(wireBytes);

    const signerAddresses = Object.keys(decoded.signatures);
    expect(signerAddresses).toEqual([OWNER]);
    // No signatures present: every required signer maps to null.
    expect(Object.values(decoded.signatures).every((signature) => signature === null)).toBe(true);
  });

  it("returns an actionable error when the balance is insufficient", async () => {
    const rpc = makeFakeRpc({ balance: 100n, rentExempt: 1_000_000n, fee: 5000n });
    const service = new RegisterService(makeFakeDb(), rpc as never, config);

    try {
      await service.register({ rawTag: "freshtag", wallet: undefined, ownerPubkey: OWNER });
      throw new Error("expected register to throw InsufficientBalanceException");
    } catch (error) {
      expect(error).toBeInstanceOf(InsufficientBalanceException);
      const response = (error as InsufficientBalanceException).getResponse() as {
        requiredLamports: string;
        currentLamports: string;
        shortfallLamports: string;
      };
      expect(response.requiredLamports).toBe((1_000_000n + 5000n).toString());
      expect(response.currentLamports).toBe("100");
      expect(response.shortfallLamports).toBe((1_000_000n + 5000n - 100n).toString());
    }
  });

  it("happy path: returns a base64 unsigned transaction with the correct derived PDA", async () => {
    const service = new RegisterService(makeFakeDb(), makeFakeRpc() as never, config);

    const result = await service.register({ rawTag: "freshtag", wallet: undefined, ownerPubkey: OWNER });

    const [expectedPda] = await deriveTagPda("freshtag" as never, PROGRAM_ID);
    expect(result.pda).toBe(expectedPda);
    expect(result.lastValidBlockHeight).toBe("1000");
    expect(typeof result.transaction).toBe("string");
    expect(result.transaction.length).toBeGreaterThan(0);
  });

  it("appends an update_wallet instruction when wallet differs from owner", async () => {
    const service = new RegisterService(makeFakeDb(), makeFakeRpc() as never, config);

    const withDifferentWallet = await service.register({
      rawTag: "freshtag",
      wallet: OTHER_WALLET,
      ownerPubkey: OWNER,
    });
    const withDefaultWallet = await service.register({
      rawTag: "freshtag2",
      wallet: undefined,
      ownerPubkey: OWNER,
    });

    // register_tag alone has no wallet parameter at all (it always sets
    // wallet = owner on-chain), so a differing wallet can only be honored
    // by appending the program's real update_wallet instruction to the same
    // transaction. That second instruction's accounts and data make the
    // compiled message strictly larger.
    const withDifferentWalletBytes = getTransactionDecoder().decode(
      getBase64Encoder().encode(withDifferentWallet.transaction),
    ).messageBytes.length;
    const withDefaultWalletBytes = getTransactionDecoder().decode(
      getBase64Encoder().encode(withDefaultWallet.transaction),
    ).messageBytes.length;

    expect(withDifferentWalletBytes).toBeGreaterThan(withDefaultWalletBytes);
  });
});
