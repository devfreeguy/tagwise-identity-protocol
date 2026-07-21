/**
 * Seam for a cache layer in front of the mirror. resolve and identity check
 * here first; a miss falls through to the mirror. The Redis-backed
 * implementation lands in stage 2, registered as the CACHE_READER provider in
 * TagsModule; do not implement it here and do not add a Redis dependency in
 * this stage.
 */
export interface CacheReader {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export const CACHE_READER = Symbol("CACHE_READER");

export class NoopCacheReader implements CacheReader {
  async get<T>(_key: string): Promise<T | undefined> {
    return undefined;
  }

  async set<T>(_key: string, _value: T): Promise<void> {
    // no-op until the stage 2 Redis-backed implementation lands
  }
}
