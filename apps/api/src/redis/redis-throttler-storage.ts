import { Inject, Injectable, Logger } from "@nestjs/common";
import type { ThrottlerStorage } from "@nestjs/throttler";

import { ConfigService } from "../config/config.service.js";
import { REDIS_CLIENT, redisKey, type ApiRedis } from "./redis.js";
import { THROTTLER_INCREMENT_LUA } from "./throttler-increment.lua.js";

declare module "ioredis" {
  interface RedisCommander<Context> {
    tipThrottlerIncrement(
      key: string,
      ttlMs: number,
      limit: number,
      blockDurationMs: number,
    ): Promise<[hits: number, timeToExpire: number, isBlocked: number, timeToBlockExpire: number]>;
  }
}

const logger = new Logger("RedisThrottlerStorage");

// ThrottlerStorageRecord is not part of @nestjs/throttler's public export
// surface (only ThrottlerStorage itself is), so its shape is derived here
// structurally from the interface method rather than deep-importing an
// internal dist path.
type IncrementResult = Awaited<ReturnType<ThrottlerStorage["increment"]>>;

/**
 * @nestjs/throttler-storage-redis (the ecosystem adapter for this) was last
 * published in 2024-08 and peer-caps @nestjs/core and @nestjs/common at
 * ^10.0.0; this workspace is on 11.1.28, a real version mismatch, not a
 * theoretical one. @nestjs/throttler's ThrottlerStorage interface is a
 * single method, so implementing it directly against ioredis here is
 * simpler and safer than depending on that stale package.
 *
 * increment() is backed by a single Lua script (THROTTLER_INCREMENT_LUA) run
 * via a custom ioredis command, so the read-modify-write hit counting is one
 * atomic round trip shared safely across every API instance, exactly the
 * point of moving off the in-memory ThrottlerStorageService.
 *
 * Fails OPEN: if Redis is unreachable, this logs a warning and returns a
 * synthetic "not blocked, zero hits" record rather than throwing. Unlike the
 * NonceStore (a security boundary against replay, which must fail closed),
 * throttling here is an abuse-mitigation mechanism layered on top of
 * endpoints that already have their own auth/ownership checks. Failing
 * closed would mean a transient Redis blip turns into a full outage of
 * every throttled endpoint (register, auth, identity update), which is a
 * worse outcome than temporarily allowing unlimited requests through, and
 * would reintroduce exactly the kind of full-instance-outage this stage is
 * meant to fix.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: ApiRedis,
    private readonly config: ConfigService,
  ) {
    this.redis.defineCommand("tipThrottlerIncrement", {
      numberOfKeys: 1,
      lua: THROTTLER_INCREMENT_LUA,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<IncrementResult> {
    // _throttlerName is not used as a separate namespace dimension: Nest's
    // ThrottlerGuard already folds the throttler name into `key` itself
    // (generateKey hashes `${ClassName}-${HandlerName}-${throttlerName}-${tracker}`),
    // so key alone is already fully qualified.
    const redisKeyName = redisKey(this.config.config.redisKeyPrefix, "throttle", key);

    try {
      const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = await this.redis.tipThrottlerIncrement(
        redisKeyName,
        ttl,
        limit,
        blockDuration,
      );
      return {
        totalHits,
        timeToExpire,
        isBlocked: isBlocked === 1,
        timeToBlockExpire,
      };
    } catch (error) {
      logger.warn(`increment() failed, Redis unreachable, failing open: ${(error as Error).message}`);
      return {
        totalHits: 0,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
