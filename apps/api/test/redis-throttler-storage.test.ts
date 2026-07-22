import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { redisKey } from "../src/redis/redis.js";
import { RedisThrottlerStorage } from "../src/redis/redis-throttler-storage.js";

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.TIP_REGISTRY_PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
  process.env.REDIS_URL = "redis://unused/for-tests";
  return new ConfigService();
}

describe("RedisThrottlerStorage", () => {
  let redis: RedisMock;
  let storage: RedisThrottlerStorage;

  beforeEach(async () => {
    redis = new RedisMock();
    // ioredis-mock instances share one global in-memory store by default
    // (as if every `new Redis()` connected to the same real server), and
    // that sharing can reach across test files under a full suite run, not
    // just within this one; without this, a stray key from elsewhere can
    // make a test see unexpected state.
    await redis.flushall();
    storage = new RedisThrottlerStorage(redis as never, makeConfigService());
  });

  it("counts hits across calls for the same key", async () => {
    const first = await storage.increment("bucket-a", 60_000, 5, 60_000, "default");
    const second = await storage.increment("bucket-a", 60_000, 5, 60_000, "default");

    expect(first.totalHits).toBe(1);
    expect(second.totalHits).toBe(2);
    expect(first.isBlocked).toBe(false);
    expect(second.isBlocked).toBe(false);
  });

  it("keeps separate counters for different keys", async () => {
    await storage.increment("bucket-a", 60_000, 5, 60_000, "default");
    const other = await storage.increment("bucket-b", 60_000, 5, 60_000, "default");

    expect(other.totalHits).toBe(1);
  });

  it("blocks once hits exceed the limit", async () => {
    const limit = 3;
    let last;
    for (let i = 0; i < limit + 1; i++) {
      last = await storage.increment("bucket-c", 60_000, limit, 60_000, "default");
    }

    expect(last!.isBlocked).toBe(true);
    expect(last!.timeToBlockExpire).toBeGreaterThan(0);
  });

  it("does not keep incrementing hits once blocked", async () => {
    const limit = 2;
    for (let i = 0; i < limit + 1; i++) {
      await storage.increment("bucket-d", 60_000, limit, 60_000, "default");
    }
    const afterBlocked = await storage.increment("bucket-d", 60_000, limit, 60_000, "default");

    expect(afterBlocked.isBlocked).toBe(true);
    expect(afterBlocked.totalHits).toBe(limit + 1);
  });

  it("resets to a fresh window after the block expires", async () => {
    const limit = 1;
    const blockDurationMs = 500;
    await storage.increment("bucket-e", 60_000, limit, blockDurationMs, "default");
    const blocked = await storage.increment("bucket-e", 60_000, limit, blockDurationMs, "default");
    expect(blocked.isBlocked).toBe(true);

    // Simulate the block having already expired by writing blockExpiresAt
    // directly into the past, rather than sleeping in real time and relying
    // on the Lua script's redis.call('TIME'): ioredis-mock's TIME command
    // was measured to drift from Date.now() by several hundred milliseconds
    // under load, which made a real-sleep version of this test flaky. This
    // way the test is deterministic and fast, and still exercises the exact
    // same reset branch of the Lua script (blockExpiresAt <= now).
    const key = redisKey("tip:", "throttle", "bucket-e");
    // The Lua script tracks time in whole seconds (see throttler-increment.lua.ts),
    // so the stored value must be a seconds epoch, not a milliseconds one.
    const wayInThePastSeconds = Math.floor(Date.now() / 1000) - 5;
    await redis.hset(key, "blockExpiresAt", String(wayInThePastSeconds));

    const afterBlockExpiry = await storage.increment("bucket-e", 60_000, limit, blockDurationMs, "default");
    expect(afterBlockExpiry.isBlocked).toBe(false);
    expect(afterBlockExpiry.totalHits).toBe(1);
  });

  it("fails open (not blocked, zero hits) when Redis is unreachable", async () => {
    const brokenRedis = {
      defineCommand: () => undefined,
      tipThrottlerIncrement: () => Promise.reject(new Error("connection refused")),
    };
    const brokenStorage = new RedisThrottlerStorage(brokenRedis as never, makeConfigService());

    const result = await brokenStorage.increment("bucket-f", 60_000, 1, 60_000, "default");

    expect(result.isBlocked).toBe(false);
    expect(result.totalHits).toBe(0);
  });
});
