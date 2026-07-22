import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

import { ConfigService } from "../config/config.service.js";
import { REDIS_CLIENT, redisKey, type ApiRedis } from "../redis/redis.js";
import type { NonceRecord, NonceStore } from "./nonce-store.js";

const logger = new Logger("RedisNonceStore");

/**
 * Redis-backed NonceStore. put() writes the key with a Redis-native TTL
 * (AUTH_NONCE_TTL), so expired nonces are reaped by Redis itself and no
 * application-side cleanup timer is needed.
 *
 * take() MUST consume the nonce atomically: a GET followed by a separate DEL
 * is a race where two concurrent verify requests can both read the nonce
 * before either deletes it, defeating replay protection under exactly the
 * concurrency an attacker would create. This uses GETDEL (Redis 6.2+),
 * a single command that reads and deletes in one round trip, so Redis's own
 * single-threaded command execution makes the two concurrent calls
 * serialize: exactly one observes the value and gets it deleted, the other
 * always sees null. No Lua script is needed since GETDEL already is the
 * atomic primitive.
 *
 * Keys are tip:nonce:<pubkey>:<nonce> (via redisKey), so one pubkey can hold
 * multiple concurrent live nonces: issuing a new challenge for a pubkey does
 * not invalidate a previous one. A design where it did would let an attacker
 * spamming /auth/challenge for a victim's pubkey deny them login.
 *
 * Fails closed: if Redis is unreachable, both put() and take() let the
 * underlying error propagate as a ServiceUnavailableException (503), never
 * falling back to any in-memory store. Silently degrading here would
 * reintroduce the multi-instance replay hole this stage exists to close.
 */
@Injectable()
export class RedisNonceStore implements NonceStore {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: ApiRedis,
    private readonly config: ConfigService,
  ) {}

  private key(pubkey: string, nonce: string): string {
    return redisKey(this.config.config.redisKeyPrefix, "nonce", pubkey, nonce);
  }

  async put(pubkey: string, nonce: string, ttlSeconds: number): Promise<void> {
    try {
      const expiresAt = Date.now() + ttlSeconds * 1000;
      await this.redis.set(this.key(pubkey, nonce), String(expiresAt), "EX", ttlSeconds);
    } catch (error) {
      logger.warn(`put() failed, Redis unreachable: ${(error as Error).message}`);
      throw new ServiceUnavailableException("nonce store is unavailable");
    }
  }

  async take(pubkey: string, nonce: string): Promise<NonceRecord | null> {
    let value: string | null;
    try {
      value = await this.redis.getdel(this.key(pubkey, nonce));
    } catch (error) {
      logger.warn(`take() failed, Redis unreachable: ${(error as Error).message}`);
      throw new ServiceUnavailableException("nonce store is unavailable");
    }

    if (value === null) {
      return null;
    }
    return { pubkey, nonce, expiresAt: Number(value) };
  }
}
