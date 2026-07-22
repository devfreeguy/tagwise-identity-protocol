import { normalizeTag, type NormalizedTag } from "@tip/core";

import { TagInvalidError } from "./errors.js";

/**
 * Normalizes and validates a tag client-side, using the exact same rules
 * (and the exact same reason codes) as the server. Throws TagInvalidError
 * without making any network call, so a caller learns a tag is malformed
 * immediately rather than after a round trip.
 */
export function normalizeTagOrThrow(rawTag: string): NormalizedTag {
  const result = normalizeTag(rawTag);
  if (!result.ok) {
    throw new TagInvalidError(rawTag, result.reason);
  }
  return result.tag;
}
