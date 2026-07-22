/**
 * Seam for a cache layer in front of the mirror. resolve and identity check
 * here first; a miss falls through to the mirror. The Redis-backed
 * implementation lands in stage 2b, registered as the CACHE_READER provider
 * in TagsModule.
 *
 * CACHE_NEGATIVE is a distinguishable sentinel a get() can return (and a
 * set() can be given) to represent a cached "not found" result, so a cached
 * miss is never confused with an actual cache miss (undefined): the caller
 * checks for this exact value before falling through to the mirror.
 */
export interface CacheReader {
  get<T>(key: string): Promise<T | typeof CACHE_NEGATIVE | undefined>;
  set<T>(key: string, value: T | typeof CACHE_NEGATIVE, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export const CACHE_READER = Symbol("CACHE_READER");

export const CACHE_NEGATIVE = Symbol("CACHE_NEGATIVE");

export class NoopCacheReader implements CacheReader {
  async get<T>(_key: string): Promise<T | typeof CACHE_NEGATIVE | undefined> {
    return undefined;
  }

  async set<T>(_key: string, _value: T | typeof CACHE_NEGATIVE, _ttlSeconds?: number): Promise<void> {
    // no-op until the stage 2b Redis-backed implementation lands
  }

  async delete(_key: string): Promise<void> {
    // no-op until the stage 2b Redis-backed implementation lands
  }
}
