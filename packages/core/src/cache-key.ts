import type { NormalizedTag } from "./normalize.js";

/**
 * Builds the cache key for a tag's resolve response. This is the single
 * place either app is allowed to construct this key: apps/api writes it,
 * apps/indexer deletes it on every applied mirror change. If the two ever
 * derived the key differently, invalidation would silently fail and stale
 * data would be served until TTL expired, with no error raised anywhere.
 * Both sides importing this same function is what makes that impossible.
 *
 * Only accepts a NormalizedTag, obtainable only from normalizeTag, so a raw
 * unnormalized string cannot be substituted without an explicit, visible
 * cast. Pure, no runtime dependencies, consistent with the rest of core.
 */
export function buildResolveCacheKey(prefix: string, normalizedTag: NormalizedTag): string {
  return `${prefix}resolve:${normalizedTag}`;
}
