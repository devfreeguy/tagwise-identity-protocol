import { buildResolveCacheKey, type NormalizedTag } from "@tip/core";
import type { Redis } from "ioredis";

import type { CacheInvalidator } from "./cache-invalidator.js";
import type { IndexerConfig } from "./config.js";
import type { Logger } from "./logger.js";

/**
 * Redis-backed CacheInvalidator. Deletes the exact resolve cache key
 * apps/api wrote for this tag, built by the SAME shared function
 * (buildResolveCacheKey from @tip/core) apps/api uses to write it: this is
 * what makes invalidation impossible to silently drift out of sync between
 * the two apps.
 *
 * Positive and negative resolve cache entries live under this same one key
 * (see apps/api's RedisCacheReader), so a single DEL busts whichever is
 * currently stored, including the negative entry left behind by an earlier
 * not-found lookup for a tag that has just been created. That is the single
 * most important case here: without it, a newly registered tag would keep
 * returning not-found for the rest of the negative TTL.
 *
 * Fails soft: if Redis is unreachable, this logs a WARN and returns,
 * mirroring keeps happening either way. The mirror staying correct matters
 * more than the cache staying fresh, and TTL is the backstop for whatever a
 * missed invalidation cannot fix immediately. Never throws, so a cache
 * failure can never stop or crash the indexer.
 */
export class RedisCacheInvalidator implements CacheInvalidator {
  constructor(
    private readonly redis: Redis,
    private readonly config: IndexerConfig,
    private readonly logger: Logger,
  ) {}

  async invalidate(tag: string): Promise<void> {
    const key = buildResolveCacheKey(this.config.redisKeyPrefix, tag as NormalizedTag);
    try {
      await this.redis.del(key);
      this.logger.debug({ tag, key }, "invalidated resolve cache key");
    } catch (error) {
      this.logger.warn({ tag, key, err: error }, "cache invalidation failed, continuing to mirror normally");
    }
  }
}
