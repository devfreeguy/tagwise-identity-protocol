import { Redis } from "ioredis";

import type { IndexerConfig } from "./config.js";
import type { Logger } from "./logger.js";

// Capped exponential backoff: 200ms, 400ms, 800ms, ... up to 5s, retried
// forever, matching apps/api's Redis client. Returning a number (never
// null) means a transient Redis outage is retried indefinitely rather than
// giving up; the indexer process itself never crashes on connection
// failure, only cache invalidation fails soft while a reconnect is pending
// (see cache-invalidator.ts).
function retryStrategy(attempt: number): number {
  return Math.min(attempt * 200, 5000);
}

/**
 * Builds the ioredis client used by RedisCacheInvalidator. ioredis infers
 * TLS from the rediss:// scheme automatically when constructed from a URL
 * string, so both redis:// and rediss:// (used by most hosted providers)
 * work without extra options here.
 */
export function createRedisClient(config: IndexerConfig, logger: Logger): Redis {
  const client = new Redis(config.redisUrl, {
    retryStrategy,
    commandTimeout: 5000,
  });

  // Without an "error" listener, ioredis throws unhandled errors on
  // connection failure; this listener's only job is to prevent that crash,
  // matching apps/api's Redis client.
  client.on("error", (error: Error) => {
    logger.warn({ err: error }, "redis connection error");
  });

  return client;
}
