import type { Logger } from "./logger.js";

/**
 * Seam for cache invalidation. The indexer calls invalidate(tag) after every
 * applied mirror change (see apply-change.ts), never on a skipped one.
 * RedisCacheInvalidator (redis-cache-invalidator.ts) is the production
 * implementation, wired in main.ts; NoopCacheInvalidator remains available
 * for tests that do not care about caching at all.
 */
export interface CacheInvalidator {
  invalidate(tag: string): Promise<void> | void;
}

export class NoopCacheInvalidator implements CacheInvalidator {
  constructor(private readonly logger: Logger) {}

  invalidate(tag: string): void {
    this.logger.debug({ tag }, "cache invalidation is a no-op seam for now");
  }
}
