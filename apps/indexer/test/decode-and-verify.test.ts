import { address } from "@solana/kit";
import { deriveTagPda, normalizeTag } from "@tip/core";
import { describe, expect, it } from "vitest";

import { decodeAndVerify } from "../src/decode-and-verify.js";
import { hexToBytes, vectors } from "./vectors.js";

// A stand-in program id for pure PDA derivation, requires no network access,
// consistent with the programId used by packages/core's own pdaCases.
const TEST_PROGRAM_ID = "11111111111111111111111111111111";
const WRONG_ADDRESS = address("So11111111111111111111111111111111111111112");

function normalizedTagOf(tag: string) {
  const result = normalizeTag(tag);
  if (!result.ok) {
    throw new Error(`expected ${JSON.stringify(tag)} to be a canonical tag`);
  }
  return result.tag;
}

describe("decodeAndVerify", () => {
  for (const testCase of vectors.accountDecodeCases.cases) {
    it(`accepts a valid buffer for ${testCase.name}`, async () => {
      const [expectedAddress] = await deriveTagPda(
        normalizedTagOf(testCase.expected.tag),
        TEST_PROGRAM_ID,
      );

      const result = await decodeAndVerify({
        address: expectedAddress,
        data: hexToBytes(testCase.bufferHex),
        slot: 42n,
        programId: TEST_PROGRAM_ID,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.change.owner).toBe(testCase.expected.owner);
        expect(result.change.wallet).toBe(testCase.expected.wallet);
        expect(result.change.tag).toBe(testCase.expected.tag);
        expect(result.change.bump).toBe(testCase.expected.bump);
        expect(result.change.slot).toBe(42n);
        expect(result.change.address).toBe(expectedAddress);
      }
    });

    it(`rejects a PDA mismatch for ${testCase.name}`, async () => {
      const result = await decodeAndVerify({
        address: WRONG_ADDRESS,
        data: hexToBytes(testCase.bufferHex),
        slot: 42n,
        programId: TEST_PROGRAM_ID,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("PDA mismatch");
      }
    });
  }

  it("rejects a truncated buffer", async () => {
    const firstCase = vectors.accountDecodeCases.cases[0];
    if (!firstCase) {
      throw new Error("expected at least one accountDecodeCase");
    }

    const truncated = hexToBytes(firstCase.bufferHex).subarray(0, 10);
    const result = await decodeAndVerify({
      address: WRONG_ADDRESS,
      data: truncated,
      slot: 1n,
      programId: TEST_PROGRAM_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("decode failed");
    }
  });
});
