import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { address as toAddress, getBase64Encoder, getTransactionDecoder } from "@solana/kit";
import { deriveTagPda } from "@tip/core";
import type { PrismaClient } from "@tip/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { UPDATE_WALLET_DISCRIMINATOR } from "../src/solana/instructions.js";
import { WalletUpdateService } from "../src/tags/wallet-update.service.js";
import { generateTestKeypair } from "./helpers/keypair.js";

const PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
const OWNER = generateTestKeypair().pubkeyBase58;
const OTHER = generateTestKeypair().pubkeyBase58;
const NEW_WALLET = generateTestKeypair().pubkeyBase58;

function makeFakeDb(existingRow: unknown = null) {
  return {
    identity: {
      findUnique: vi.fn().mockResolvedValue(existingRow),
    },
  } as unknown as PrismaClient;
}

function makeFakeRpc() {
  return {
    getLatestBlockhash: vi.fn().mockReturnValue({
      send: vi.fn().mockResolvedValue({
        value: { blockhash: toAddress("11111111111111111111111111111111"), lastValidBlockHeight: 1000n },
      }),
    }),
  };
}

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.REDIS_URL = "redis://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.TIP_REGISTRY_PROGRAM_ID = PROGRAM_ID;
  return new ConfigService();
}

describe("WalletUpdateService", () => {
  let config: ConfigService;

  beforeEach(() => {
    config = makeConfigService();
  });

  it("rejects with 404 for a missing tag", async () => {
    const service = new WalletUpdateService(makeFakeDb(null), makeFakeRpc() as never, config);

    await expect(
      service.buildTransaction({ tag: "ghost" as never, ownerPubkey: OWNER, newWallet: NEW_WALLET }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects with 404 for a blocked tag", async () => {
    const service = new WalletUpdateService(
      makeFakeDb({ owner: OWNER, status: "blocked" }),
      makeFakeRpc() as never,
      config,
    );

    await expect(
      service.buildTransaction({ tag: "daniel" as never, ownerPubkey: OWNER, newWallet: NEW_WALLET }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects with 403 when the caller does not own the tag", async () => {
    const service = new WalletUpdateService(
      makeFakeDb({ owner: OWNER, status: "active" }),
      makeFakeRpc() as never,
      config,
    );

    await expect(
      service.buildTransaction({ tag: "daniel" as never, ownerPubkey: OTHER, newWallet: NEW_WALLET }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects an invalid new wallet address", async () => {
    const service = new WalletUpdateService(
      makeFakeDb({ owner: OWNER, status: "active" }),
      makeFakeRpc() as never,
      config,
    );

    await expect(
      service.buildTransaction({ tag: "daniel" as never, ownerPubkey: OWNER, newWallet: "not-a-valid-address" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("happy path: returns an unsigned transaction containing only the update_wallet instruction", async () => {
    const service = new WalletUpdateService(
      makeFakeDb({ owner: OWNER, status: "active" }),
      makeFakeRpc() as never,
      config,
    );

    const result = await service.buildTransaction({ tag: "daniel" as never, ownerPubkey: OWNER, newWallet: NEW_WALLET });

    const [expectedPda] = await deriveTagPda("daniel" as never, PROGRAM_ID);
    expect(result.pda).toBe(expectedPda);
    expect(result.lastValidBlockHeight).toBe("1000");

    const decoded = getTransactionDecoder().decode(getBase64Encoder().encode(result.transaction));

    // Unsigned: the only required signer (owner) maps to null.
    const signerAddresses = Object.keys(decoded.signatures);
    expect(signerAddresses).toEqual([OWNER]);
    expect(Object.values(decoded.signatures).every((signature) => signature === null)).toBe(true);

    const compiledMessage = new TextDecoder("latin1").decode(decoded.messageBytes);
    const discriminatorString = Array.from(UPDATE_WALLET_DISCRIMINATOR)
      .map((byte) => String.fromCharCode(byte))
      .join("");
    expect(compiledMessage.includes(discriminatorString)).toBe(true);
  });
});
