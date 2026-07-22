import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { TipClient } from "../src/client.js";

const PROGRAM_ID = "11111111111111111111111111111111";

const vectorsPath = fileURLToPath(new URL("../../core/test-vectors/tag-rules.json", import.meta.url));
const vectors = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  accountDecodeCases: {
    cases: { name: string; bufferHex: string; expected: { owner: string; wallet: string; tag: string; bump: number } }[];
  };
};

function danielCase() {
  const found = vectors.accountDecodeCases.cases.find((c) => c.name === "daniel");
  if (!found) {
    throw new Error("expected a 'daniel' account decode case in the shared test vectors");
  }
  return found;
}

function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

// A fake @solana/kit RPC client, injected directly via TipClientOptions.rpc
// rather than mocking the @solana/kit module: this is simpler, faster, and
// does not depend on how @solana/kit's multi-condition package exports
// resolve in any given test environment.
function makeFakeRpc(sendResult: unknown) {
  const sendMock = vi.fn().mockResolvedValue(sendResult);
  const getAccountInfoMock = vi.fn().mockReturnValue({ send: sendMock });
  return { rpc: { getAccountInfo: getAccountInfoMock } as never, sendMock, getAccountInfoMock };
}

describe("TipClient.resolveOnChain", () => {
  it("returns correctly decoded on-chain fields with null profile fields for a real account buffer", async () => {
    const testCase = danielCase();
    const { rpc, sendMock, getAccountInfoMock } = makeFakeRpc({
      value: { data: [hexToBase64(testCase.bufferHex), "base64"] },
    });
    const client = new TipClient({ baseUrl: "https://api.example.com", rpc, programId: PROGRAM_ID, fetch: vi.fn() as never });

    const result = await client.resolveOnChain("daniel");

    expect(result).not.toBeNull();
    expect(result?.tag).toBe(testCase.expected.tag);
    expect(result?.owner).toBe(testCase.expected.owner);
    expect(result?.wallet).toBe(testCase.expected.wallet);
    expect(result?.bump).toBe(testCase.expected.bump);
    expect(result?.displayName).toBeNull();
    expect(result?.avatar).toBeNull();
    expect(result?.bio).toBeNull();
    expect(result?.preferredToken).toBeNull();
    expect(result?.verified).toBe(false);
    expect(result?.merchant).toBe(false);

    expect(getAccountInfoMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ commitment: "finalized", encoding: "base64" }),
    );
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("returns null for a missing account", async () => {
    const { rpc } = makeFakeRpc({ value: null });
    const client = new TipClient({ baseUrl: "https://api.example.com", rpc, programId: PROGRAM_ID, fetch: vi.fn() as never });

    const result = await client.resolveOnChain("ghosttagx");

    expect(result).toBeNull();
  });

  it("throws if rpcUrl/rpc was not configured", async () => {
    const client = new TipClient({ baseUrl: "https://api.example.com", fetch: vi.fn() as never });

    await expect(client.resolveOnChain("daniel")).rejects.toThrow("rpcUrl is required");
  });

  it("uses @tip/core's TIP_REGISTRY_PROGRAM_ID by default when no programId override is given", async () => {
    const { rpc, getAccountInfoMock } = makeFakeRpc({ value: null });
    // No programId passed: the client must derive the PDA using
    // @tip/core's real TIP_REGISTRY_PROGRAM_ID, not a hardcoded test id.
    const client = new TipClient({ baseUrl: "https://api.example.com", rpc, fetch: vi.fn() as never });

    await client.resolveOnChain("daniel");

    const { deriveTagPda } = await import("@tip/core");
    const [expectedPda] = await deriveTagPda("daniel" as never, "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx");
    expect(getAccountInfoMock).toHaveBeenCalledWith(expectedPda, expect.anything());
  });
});
