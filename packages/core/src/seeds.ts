import { MAX_TAG_LENGTH, TAG_SEED_PREFIX } from "./constants.js";
import type { NormalizedTag } from "./normalize.js";

/**
 * Encodes a string known to contain only ASCII characters into its raw
 * bytes, one byte per character. Written by hand instead of relying on
 * TextEncoder so this file has no dependency on host or DOM globals.
 */
function asciiBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    bytes[i] = value.charCodeAt(i);
  }
  return bytes;
}

/**
 * Defense in depth against a NormalizedTag obtained through a cast rather
 * than normalizeTag, or a value coming in from untyped JavaScript. The
 * NormalizedTag type prevents this at compile time, this guard catches it
 * at runtime instead of silently truncating or encoding garbage.
 */
function assertShapeOfNormalizedTag(tag: string): void {
  if (tag.length > MAX_TAG_LENGTH) {
    throw new Error(
      `buildTagSeeds: tag length ${tag.length} exceeds MAX_TAG_LENGTH (${MAX_TAG_LENGTH})`,
    );
  }
  for (let i = 0; i < tag.length; i++) {
    const code = tag.charCodeAt(i);
    if (code > 127) {
      throw new Error(
        `buildTagSeeds: tag contains a non-ASCII character at index ${i} (char code ${code})`,
      );
    }
  }
}

/**
 * Builds the ordered PDA seeds for a tag account: the ASCII bytes of the
 * seed prefix, then the ASCII bytes of the normalized tag.
 *
 * Only accepts a NormalizedTag, which can only come from normalizeTag, so
 * passing an unnormalized string is a compile error. This function does no
 * hashing and no validation of its own beyond the defense in depth guard
 * above, it only encodes bytes, so it is pure and has no runtime
 * dependencies.
 */
export function buildTagSeeds(normalizedTag: NormalizedTag): Uint8Array[] {
  assertShapeOfNormalizedTag(normalizedTag);
  return [asciiBytes(TAG_SEED_PREFIX), asciiBytes(normalizedTag)];
}
