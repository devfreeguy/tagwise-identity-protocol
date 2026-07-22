import { getAddressDecoder, type Address } from "@solana/addresses";

import { MAX_TAG_LENGTH } from "./constants.js";
import { normalizeTag, type NormalizedTag } from "./normalize.js";

const DISCRIMINATOR_LENGTH = 8;
const PUBKEY_LENGTH = 32;

const OWNER_OFFSET = DISCRIMINATOR_LENGTH;
const WALLET_OFFSET = OWNER_OFFSET + PUBKEY_LENGTH;
const TAG_OFFSET = WALLET_OFFSET + PUBKEY_LENGTH;
const TAG_LEN_OFFSET = TAG_OFFSET + MAX_TAG_LENGTH;
const BUMP_OFFSET = TAG_LEN_OFFSET + 1;

/**
 * Total on-chain size of a tip_registry TagAccount: discriminator, owner,
 * wallet, the fixed tag buffer, tag_len, and bump. The struct has no
 * variable-length fields, so this is always exact.
 */
export const TAG_ACCOUNT_SIZE = BUMP_OFFSET + 1;

/**
 * The 8-byte Anchor account discriminator for tip_registry's TagAccount:
 * the first 8 bytes of sha256("account:TagAccount"), the way Anchor derives
 * it. This is a deterministic constant, not a runtime computation: it is a
 * literal here (not computed via node:crypto) so this package has no Node
 * builtin dependency and stays safe to bundle into a browser app. The
 * literal can never silently drift from the program because
 * test/account.test.ts independently recomputes sha256("account:TagAccount")
 * with node:crypto (test-only, never shipped) and asserts it matches this
 * exact byte sequence.
 */
export const TAG_ACCOUNT_DISCRIMINATOR: Uint8Array = Uint8Array.from([
  206, 141, 84, 39, 161, 42, 185, 170,
]);

/**
 * A decoded tip_registry tag account. tag is always canonical, never the
 * raw zero-padded on-chain buffer.
 */
export type TagAccount = Readonly<{
  owner: Address;
  wallet: Address;
  tag: NormalizedTag;
  bump: number;
}>;

export type TagAccountDecodeErrorReason =
  | "INVALID_LENGTH"
  | "DISCRIMINATOR_MISMATCH"
  | "INVALID_PADDING"
  | "NON_CANONICAL_TAG";

/**
 * Thrown by decodeTagAccount whenever a buffer cannot be trusted as a valid
 * tip_registry TagAccount. Every throw carries a specific reason, never a
 * silent fallback to a partially-decoded value.
 */
export class TagAccountDecodeError extends Error {
  readonly reason: TagAccountDecodeErrorReason;

  constructor(reason: TagAccountDecodeErrorReason, message: string) {
    super(message);
    this.name = "TagAccountDecodeError";
    this.reason = reason;
  }
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Reads a single byte at offset, throwing rather than returning undefined.
 * Every call site here is only reached after the exact buffer length has
 * already been checked, so this is defense in depth, not the primary bounds
 * check.
 */
function readByte(data: Uint8Array, offset: number): number {
  const byte = data[offset];
  if (byte === undefined) {
    throw new TagAccountDecodeError(
      "INVALID_LENGTH",
      `buffer too short to read byte at offset ${offset}`,
    );
  }
  return byte;
}

const addressDecoder = getAddressDecoder();

/**
 * Decodes a raw tip_registry TagAccount buffer into a TagAccount.
 *
 * Verifies the account discriminator, the exact buffer length, and that the
 * tag buffer's padding past tag_len is all zero, then runs the recovered tag
 * back through normalizeTag to guarantee it is canonical before returning
 * it. Throws TagAccountDecodeError, never returns a partially valid result.
 */
export function decodeTagAccount(data: Uint8Array): TagAccount {
  if (data.length !== TAG_ACCOUNT_SIZE) {
    throw new TagAccountDecodeError(
      "INVALID_LENGTH",
      `expected a ${TAG_ACCOUNT_SIZE}-byte TagAccount buffer, got ${data.length} bytes`,
    );
  }

  const discriminator = data.subarray(0, DISCRIMINATOR_LENGTH);
  if (!bytesEqual(discriminator, TAG_ACCOUNT_DISCRIMINATOR)) {
    throw new TagAccountDecodeError(
      "DISCRIMINATOR_MISMATCH",
      `discriminator mismatch: expected ${toHex(TAG_ACCOUNT_DISCRIMINATOR)}, got ${toHex(discriminator)}`,
    );
  }

  const owner = addressDecoder.decode(data.subarray(OWNER_OFFSET, WALLET_OFFSET));
  const wallet = addressDecoder.decode(data.subarray(WALLET_OFFSET, TAG_OFFSET));

  const tagBuffer = data.subarray(TAG_OFFSET, TAG_LEN_OFFSET);
  const tagLen = readByte(data, TAG_LEN_OFFSET);
  const bump = readByte(data, BUMP_OFFSET);

  if (tagLen > MAX_TAG_LENGTH) {
    throw new TagAccountDecodeError(
      "INVALID_LENGTH",
      `tag_len ${tagLen} exceeds MAX_TAG_LENGTH (${MAX_TAG_LENGTH})`,
    );
  }

  for (let i = tagLen; i < MAX_TAG_LENGTH; i++) {
    const paddingByte = readByte(tagBuffer, i);
    if (paddingByte !== 0) {
      throw new TagAccountDecodeError(
        "INVALID_PADDING",
        `expected zero padding after tag_len (${tagLen}), found byte ${paddingByte} at tag buffer offset ${i}`,
      );
    }
  }

  let rawTag = "";
  for (let i = 0; i < tagLen; i++) {
    rawTag += String.fromCharCode(readByte(tagBuffer, i));
  }

  const normalized = normalizeTag(rawTag);
  if (!normalized.ok) {
    throw new TagAccountDecodeError(
      "NON_CANONICAL_TAG",
      `stored tag ${JSON.stringify(rawTag)} failed normalization: ${normalized.reason}`,
    );
  }
  if (normalized.tag !== rawTag) {
    // normalizeTag repairs fixable input (strips "@", lowercases) instead of
    // rejecting it, so a repaired result differing from the raw stored bytes
    // means the on-chain value was never actually canonical to begin with.
    throw new TagAccountDecodeError(
      "NON_CANONICAL_TAG",
      `stored tag ${JSON.stringify(rawTag)} is not already canonical (normalizes to ${JSON.stringify(normalized.tag)})`,
    );
  }

  return {
    owner,
    wallet,
    tag: normalized.tag,
    bump,
  };
}
