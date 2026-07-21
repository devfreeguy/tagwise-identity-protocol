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
