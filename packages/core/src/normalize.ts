import {
  ALLOWED_TAG_CHARACTERS_PATTERN,
  MAX_TAG_LENGTH,
  MIN_TAG_LENGTH,
} from "./constants.js";

/**
 * Reason a tag failed normalization or validation. Every rejection carries
 * exactly one of these, never a silent fallback.
 */
export type TagRejectionReason =
  | "EMPTY"
  | "BAD_AT"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_CHAR";

export type TagRejection = Readonly<{
  ok: false;
  reason: TagRejectionReason;
}>;

declare const normalizedTagBrand: unique symbol;

/**
 * A string that has passed normalizeTag. The only way to obtain one is to
 * call normalizeTag and receive an accepted result, so a plain string
 * cannot be substituted without an explicit, visible cast.
 */
export type NormalizedTag = string & Readonly<{ [normalizedTagBrand]: true }>;

export type TagAccepted = Readonly<{
  ok: true;
  tag: NormalizedTag;
}>;

export type NormalizeTagResult = TagAccepted | TagRejection;

function reject(reason: TagRejectionReason): TagRejection {
  return { ok: false, reason };
}

function accept(tag: string): TagAccepted {
  return { ok: true, tag: tag as NormalizedTag };
}

/**
 * Normalizes and validates a raw tag input against the canonical tag rules.
 *
 * The only silent transforms are stripping one optional leading "@" and
 * lowercasing. Everything else that does not conform to the rules is a
 * rejection with a specific reason code. This function is pure and has no
 * runtime dependencies, so it can be ported to Rust byte-for-byte.
 *
 * Steps, in order:
 * 1. Reject empty raw input (EMPTY).
 * 2. Reject an "@" anywhere other than the first character (BAD_AT).
 * 3. Strip a leading "@" if present.
 * 4. Lowercase the result.
 * 5. Reject if the result is empty after stripping (EMPTY).
 * 6. Reject if shorter than MIN_TAG_LENGTH (TOO_SHORT).
 * 7. Reject if longer than MAX_TAG_LENGTH (TOO_LONG).
 * 8. Reject if any character is outside a-z, 0-9, underscore (INVALID_CHAR).
 */
export function normalizeTag(raw: string): NormalizeTagResult {
  if (raw.length === 0) {
    return reject("EMPTY");
  }

  for (let i = 1; i < raw.length; i++) {
    if (raw[i] === "@") {
      return reject("BAD_AT");
    }
  }

  const stripped = raw[0] === "@" ? raw.slice(1) : raw;
  const lowered = stripped.toLowerCase();

  if (lowered.length === 0) {
    return reject("EMPTY");
  }

  if (lowered.length < MIN_TAG_LENGTH) {
    return reject("TOO_SHORT");
  }

  if (lowered.length > MAX_TAG_LENGTH) {
    return reject("TOO_LONG");
  }

  if (!ALLOWED_TAG_CHARACTERS_PATTERN.test(lowered)) {
    return reject("INVALID_CHAR");
  }

  return accept(lowered);
}

/**
 * Returns true if the raw input normalizes to a valid tag.
 */
export function isValidTag(raw: string): boolean {
  return normalizeTag(raw).ok;
}
