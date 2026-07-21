import type { Logger } from "./logger.js";

/**
 * Seam for cache invalidation. The indexer calls invalidate(tag) after every
 * applied mirror change. The Redis-backed implementation lands with the API
 * step; do not implement it here and do not add a Redis dependency in this
 * app. NoopCacheInvalidator is the only implementation until then.
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
