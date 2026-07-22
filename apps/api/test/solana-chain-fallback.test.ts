import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Logger } from "@nestjs/common";
import { deriveTagPda } from "@tip/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { SolanaChainFallback } from "../src/tags/solana-chain-fallback.js";

const PROGRAM_ID = "11111111111111111111111111111111";

const vectorsPath = fileURLToPath(new URL("../../../packages/core/test-vectors/tag-rules.json", import.meta.url));
const vectors = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  accountDecodeCases: {
    cases: { name: string; bufferHex: string; expected: { owner: string; wallet: string; tag: string; bump: number } }[];
  };
};

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function danielCase() {
  const found = vectors.accountDecodeCases.cases.find((c) => c.name === "daniel");
  if (!found) {
    throw new Error("expected a 'daniel' account decode case in the shared test vectors");
  }
  return found;
}

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.TIP_REGISTRY_PROGRAM_ID = PROGRAM_ID;
  process.env.REDIS_URL = "redis://unused/for-tests";
  return new ConfigService();
}

function makeFakeRpc(sendImpl: () => Promise<{ value: unknown }>) {
  return {
    getAccountInfo: vi.fn().mockReturnValue({ send: sendImpl }),
  };
}

describe("SolanaChainFallback", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  it("returns undefined and does not warn when the account genuinely does not exist on-chain", async () => {
    const rpc = makeFakeRpc(() => Promise.resolve({ value: null }));
    const fallback = new SolanaChainFallback(rpc as never, makeConfigService());

    const result = await fallback.lookup("daniel");

    expect(result).toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("treats an RPC failure as not-found and logs it, never throwing", async () => {
    const rpc = makeFakeRpc(() => Promise.reject(new Error("RPC unreachable")));
    const fallback = new SolanaChainFallback(rpc as never, makeConfigService());

    const result = await fallback.lookup("daniel");

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("RPC call failed"));
  });

  it("returns undefined and logs when the account data fails to decode", async () => {
    const rpc = makeFakeRpc(() =>
      Promise.resolve({
        value: { data: [Buffer.from([1, 2, 3]).toString("base64"), "base64"] },
      }),
    );
    const fallback = new SolanaChainFallback(rpc as never, makeConfigService());

    const result = await fallback.lookup("daniel");

    expect(result).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("decode failed"));
  });

  it("a real on-chain hit decodes successfully, logs a WARN anomaly, and returns null profile fields", async () => {
    const testCase = danielCase();
    const rpc = makeFakeRpc(() =>
      Promise.resolve({
        value: { data: [Buffer.from(hexToBytes(testCase.bufferHex)).toString("base64"), "base64"] },
      }),
    );
    const fallback = new SolanaChainFallback(rpc as never, makeConfigService());

    const result = await fallback.lookup("daniel");

    expect(result).toBeDefined();
    expect(result?.tag).toBe(testCase.expected.tag);
    expect(result?.owner).toBe(testCase.expected.owner);
    expect(result?.wallet).toBe(testCase.expected.wallet);
    expect(result?.bump).toBe(testCase.expected.bump);
    expect(result?.status).toBe("active");

    // Off-chain profile fields are unavailable from a bare on-chain account.
    expect(result?.displayName).toBeNull();
    expect(result?.avatar).toBeNull();
    expect(result?.bio).toBeNull();
    expect(result?.preferredToken).toBeNull();
    expect(result?.verified).toBe(false);
    expect(result?.merchant).toBe(false);

    // A hit is an anomaly and must be logged loudly.
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("chain fallback HIT"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("daniel"));
  });

  it("requests the account at finalized commitment for the derived PDA", async () => {
    const testCase = danielCase();
    const sendImpl = () =>
      Promise.resolve({
        value: { data: [Buffer.from(hexToBytes(testCase.bufferHex)).toString("base64"), "base64"] },
      });
    const rpc = makeFakeRpc(sendImpl);
    const fallback = new SolanaChainFallback(rpc as never, makeConfigService());

    await fallback.lookup("daniel");

    const [expectedPda] = await deriveTagPda("daniel" as never, PROGRAM_ID);
    expect(rpc.getAccountInfo).toHaveBeenCalledWith(expectedPda, {
      commitment: "finalized",
      encoding: "base64",
    });
  });
});
