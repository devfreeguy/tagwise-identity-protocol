import { Inject, Injectable, Logger } from "@nestjs/common";

import { ConfigService } from "../config/config.service.js";
import { REDIS_CLIENT, type ApiRedis } from "../redis/redis.js";
import { CACHE_NEGATIVE, type CacheReader } from "./cache-reader.js";

const logger = new Logger("RedisCacheReader");

// The wire-format string written to Redis to represent CACHE_NEGATIVE. Never
// a value JSON.stringify would ever produce for a real ResolveResponseDto
// (which is always a JSON object, never this bare string), so it cannot be
// confused with a real cached response on read.
const NEGATIVE_SENTINEL = "__TIP_CACHE_NEGATIVE__";

/**
 * Redis-backed CacheReader. Only resolve responses are cached this stage:
 * search has too many query permutations and a low hit rate to be worth
 * caching, and identity/availability are deliberately left uncached too
 * (resolve is the hot payment-lookup path; those are not). Rather than
 * TagsService deciding what to cache, this class decides by key shape: only
 * keys built by @tip/core's buildResolveCacheKey (prefix + "resolve:") are
 * ever written to or read from Redis; every other key (for example
 * TagsService.identity()'s "identity:<tag>") is treated as a pure no-op,
 * identical to NoopCacheReader, so TagsService.identity() and friends are
 * completely unaffected by this provider swap.
 *
 * Fails OPEN: any Redis error on get() is logged and treated as a cache
 * miss, so the caller reads straight from the mirror; any Redis error on
 * set() is logged and swallowed, so a slow or unreachable cache degrades
 * performance, never availability. This is the deliberate opposite of the
 * NonceStore's fail-closed behavior: a stale or missing cache entry for a
 * public payment lookup is a minor inconvenience, whereas serving an
 * unauthenticated session would be a security failure, so the two seams are
 * allowed to fail in opposite directions on purpose.
 */
@Injectable()
export class RedisCacheReader implements CacheReader {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: ApiRedis,
    private readonly config: ConfigService,
  ) {}

  private isResolveKey(key: string): boolean {
    return key.startsWith(`${this.config.config.redisKeyPrefix}resolve:`);
  }

  async get<T>(key: string): Promise<T | typeof CACHE_NEGATIVE | undefined> {
    if (!this.isResolveKey(key)) {
      return undefined;
    }

    try {
      const raw = await this.redis.get(key);
      if (raw === null) {
        return undefined;
      }
      if (raw === NEGATIVE_SENTINEL) {
        return CACHE_NEGATIVE;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.warn(`get() failed, failing open to the mirror: ${(error as Error).message}`);
      return undefined;
    }
  }

  async set<T>(key: string, value: T | typeof CACHE_NEGATIVE, ttlSeconds?: number): Promise<void> {
    if (!this.isResolveKey(key)) {
      return;
    }

    try {
      const ttl = ttlSeconds ?? this.config.config.resolveCacheTtlSeconds;
      const raw = value === CACHE_NEGATIVE ? NEGATIVE_SENTINEL : JSON.stringify(value);
      await this.redis.set(key, raw, "EX", ttl);
    } catch (error) {
      logger.warn(`set() failed, continuing without caching: ${(error as Error).message}`);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isResolveKey(key)) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      // Fails open, same as get() and set(): an off-chain profile write
      // (see TagsService.updateIdentity) must never turn into an error
      // response just because the cache could not be invalidated. The
      // positive TTL is the backstop for whatever this miss leaves stale.
      logger.warn(`delete() failed, continuing without invalidating: ${(error as Error).message}`);
    }
  }
}
