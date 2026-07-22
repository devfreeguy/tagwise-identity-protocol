import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  decodeTagAccount,
  TAG_ACCOUNT_DISCRIMINATOR,
  TagAccountDecodeError,
} from "../src/account.js";
import { vectors } from "./vectors.js";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const { cases, discriminatorHex } = vectors.accountDecodeCases;

describe("decodeTagAccount", () => {
  it("computes the discriminator matching the shared vector", () => {
    expect(Buffer.from(TAG_ACCOUNT_DISCRIMINATOR).toString("hex")).toBe(discriminatorHex);
  });

  it("the literal TAG_ACCOUNT_DISCRIMINATOR matches a fresh sha256(\"account:TagAccount\") derivation", () => {
    // TAG_ACCOUNT_DISCRIMINATOR in src/account.ts is a hardcoded literal, not
    // a runtime sha256 computation, so packages/core has no node:crypto
    // dependency in its shipped path (it must stay safe to bundle into a
    // browser app, see packages/sdk). This test is the guard against that
    // literal ever silently drifting from what Anchor would actually derive:
    // it independently recomputes the hash here, in a test file, where a
    // node:crypto import is acceptable.
    const hash = createHash("sha256").update("account:TagAccount").digest();
    const expectedDiscriminator = new Uint8Array(hash.subarray(0, 8));

    expect(Array.from(TAG_ACCOUNT_DISCRIMINATOR)).toEqual(Array.from(expectedDiscriminator));
  });

  for (const testCase of cases) {
    it(`decodes ${testCase.name}`, () => {
      const buffer = hexToBytes(testCase.bufferHex);
      const account = decodeTagAccount(buffer);

      expect(account.owner).toBe(testCase.expected.owner);
      expect(account.wallet).toBe(testCase.expected.wallet);
      expect(account.tag).toBe(testCase.expected.tag);
      expect(account.bump).toBe(testCase.expected.bump);
    });
  }

  it("throws on a wrong discriminator", () => {
    const buffer = hexToBytes(cases[0].bufferHex);
    buffer[0] = buffer[0] ^ 0xff;

    expect(() => decodeTagAccount(buffer)).toThrow(TagAccountDecodeError);
    try {
      decodeTagAccount(buffer);
      throw new Error("expected decodeTagAccount to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TagAccountDecodeError);
      expect((error as TagAccountDecodeError).reason).toBe("DISCRIMINATOR_MISMATCH");
    }
  });

  it("throws on a truncated buffer", () => {
    const buffer = hexToBytes(cases[0].bufferHex).subarray(0, 50);

    expect(() => decodeTagAccount(buffer)).toThrow(TagAccountDecodeError);
    try {
      decodeTagAccount(buffer);
      throw new Error("expected decodeTagAccount to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TagAccountDecodeError);
      expect((error as TagAccountDecodeError).reason).toBe("INVALID_LENGTH");
    }
  });

  it("throws when padding after tag_len is not zero", () => {
    const buffer = hexToBytes(cases[0].bufferHex);
    // tag field starts right after discriminator (8) + owner (32) + wallet (32) = offset 72.
    // "daniel" is 6 bytes, so offset 72 + 6 = 78 is the first padding byte.
    buffer[78] = 0x01;

    expect(() => decodeTagAccount(buffer)).toThrow(TagAccountDecodeError);
    try {
      decodeTagAccount(buffer);
      throw new Error("expected decodeTagAccount to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TagAccountDecodeError);
      expect((error as TagAccountDecodeError).reason).toBe("INVALID_PADDING");
    }
  });

  it("throws when the stored tag is not canonical", () => {
    const buffer = hexToBytes(cases[0].bufferHex);
    // Overwrite the first tag byte ("d" in "daniel") with an uppercase letter,
    // which the real program would never allow onto the chain, but the
    // decoder must still refuse to trust rather than silently accept.
    buffer[72] = "D".charCodeAt(0);

    expect(() => decodeTagAccount(buffer)).toThrow(TagAccountDecodeError);
    try {
      decodeTagAccount(buffer);
      throw new Error("expected decodeTagAccount to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(TagAccountDecodeError);
      expect((error as TagAccountDecodeError).reason).toBe("NON_CANONICAL_TAG");
    }
  });
});
