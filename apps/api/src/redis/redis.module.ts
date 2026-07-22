import { Global, Logger, Module, type OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";

import { ConfigService } from "../config/config.service.js";
import { RedisThrottlerStorage } from "./redis-throttler-storage.js";
import { REDIS_CLIENT } from "./redis.js";

const logger = new Logger("Redis");

// Capped exponential backoff: 200ms, 400ms, 800ms, ... up to 5s, retried
// forever. Returning a number (never null) means ioredis keeps retrying a
// transient outage indefinitely instead of giving up and leaving the client
// permanently disconnected; the process itself never crashes on connection
// failure, only individual requests fail closed (see NonceStore and
// ThrottlerStorage) while a reconnect is in progress.
function retryStrategy(attempt: number): number {
  return Math.min(attempt * 200, 5000);
}

function createRedisClient(config: ConfigService): Redis {
  // ioredis infers TLS from the rediss:// scheme automatically when
  // constructed from a URL string, so both redis:// and rediss:// (used by
  // most hosted providers) work without any extra options here.
  const client = new Redis(config.config.redisUrl, {
    retryStrategy,
    // Commands issued while disconnected are queued by default and would
    // otherwise hang until reconnect; every call site in this stage
    // (NonceStore, ThrottlerStorage) wraps its Redis calls with its own
    // fail-closed handling, so a short, explicit command timeout is used
    // instead of letting requests hang indefinitely.
    commandTimeout: 5000,
  });

  // ioredis throws an unhandled error if a client with no "error" listener
  // emits one; this listener's only job is to prevent that crash; actual
  // failure handling happens at each call site.
  client.on("error", (error: Error) => {
    logger.warn(`Redis connection error: ${error.message}`);
  });

  return client;
}

class RedisClientHolder implements OnModuleDestroy {
  readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = createRedisClient(config);
  }

  async onModuleDestroy(): Promise<void> {
    // quit() waits for in-flight commands and closes gracefully; if Redis is
    // already unreachable that can hang, so disconnect() is the hard
    // fallback that always resolves.
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: RedisClientHolder,
      useFactory: (config: ConfigService) => new RedisClientHolder(config),
      inject: [ConfigService],
    },
    {
      provide: REDIS_CLIENT,
      useFactory: (holder: RedisClientHolder) => holder.client,
      inject: [RedisClientHolder],
    },
    // A single shared instance, provided here (not per feature module) so
    // AuthModule, RegisterModule, and TagsModule's separate
    // ThrottlerModule.forRootAsync calls all back onto the same Redis-backed
    // storage and the same defineCommand() registration.
    RedisThrottlerStorage,
  ],
  exports: [REDIS_CLIENT, RedisThrottlerStorage],
})
export class RedisModule {}
