import { buildResolveCacheKey, normalizeTag } from "@tip/core";
import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IndexerConfig } from "../src/config.js";
import { RedisCacheInvalidator } from "../src/redis-cache-invalidator.js";

function normalizedTagOf(raw: string) {
  const result = normalizeTag(raw);
  if (!result.ok) {
    throw new Error(`expected ${raw} to normalize successfully`);
  }
  return result.tag;
}

function makeConfig(): IndexerConfig {
  return {
    rpcHttpUrl: "https://api.devnet.solana.com",
    rpcWssUrl: "wss://api.devnet.solana.com",
    programId: "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx",
    databaseUrl: "postgresql://unused/for-tests",
    commitment: "finalized",
    reconcileCron: "0 3 * * *",
    redisUrl: "redis://unused/for-tests",
    redisKeyPrefix: "tip:",
  };
}

function makeFakeLogger() {
  return {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  } as never;
}

describe("RedisCacheInvalidator", () => {
  let redis: RedisMock;
  let config: IndexerConfig;

  beforeEach(async () => {
    redis = new RedisMock();
    // ioredis-mock instances share one global in-memory store by default;
    // without this, state can leak in from another test.
    await redis.flushall();
    config = makeConfig();
  });

  it("deletes the exact key built by @tip/core's buildResolveCacheKey", async () => {
    const tag = normalizedTagOf("daniel");
    const key = buildResolveCacheKey(config.redisKeyPrefix, tag);
    await redis.set(key, JSON.stringify({ tag: "@daniel" }));

    const invalidator = new RedisCacheInvalidator(redis as never, config, makeFakeLogger());
    await invalidator.invalidate(tag);

    expect(await redis.get(key)).toBeNull();
  });

  it("busts a cached NEGATIVE entry the same way (same one key, positive or negative)", async () => {
    const tag = normalizedTagOf("freshtag");
    const key = buildResolveCacheKey(config.redisKeyPrefix, tag);
    await redis.set(key, "__TIP_CACHE_NEGATIVE__");

    const invalidator = new RedisCacheInvalidator(redis as never, config, makeFakeLogger());
    await invalidator.invalidate(tag);

    expect(await redis.get(key)).toBeNull();
  });

  it("does not throw and logs a warning when Redis is unreachable", async () => {
    const brokenRedis = { del: () => Promise.reject(new Error("connection refused")) };
    const logger = makeFakeLogger();
    const invalidator = new RedisCacheInvalidator(brokenRedis as never, config, logger);

    await expect(invalidator.invalidate(normalizedTagOf("daniel"))).resolves.toBeUndefined();
    expect((logger as unknown as { warn: ReturnType<typeof vi.fn> }).warn).toHaveBeenCalled();
  });

  it("CROSS-APP KEY AGREEMENT: the key this class actually deletes is byte-identical to @tip/core's buildResolveCacheKey output, the same function apps/api uses to write it", async () => {
    const delSpy = vi.spyOn(redis, "del");
    const tag = normalizedTagOf("daniel");
    const expectedKey = buildResolveCacheKey(config.redisKeyPrefix, tag);

    const invalidator = new RedisCacheInvalidator(redis as never, config, makeFakeLogger());
    await invalidator.invalidate(tag);

    expect(delSpy).toHaveBeenCalledWith(expectedKey);
  });
});
