import { buildResolveCacheKey } from "@tip/core";
import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { CACHE_NEGATIVE } from "../src/tags/cache-reader.js";
import { RedisCacheReader } from "../src/tags/redis-cache-reader.js";

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.TIP_REGISTRY_PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
  process.env.REDIS_URL = "redis://unused/for-tests";
  process.env.REDIS_KEY_PREFIX = "tip:";
  process.env.RESOLVE_CACHE_TTL = "300";
  process.env.RESOLVE_CACHE_NEGATIVE_TTL = "30";
  return new ConfigService();
}

describe("RedisCacheReader", () => {
  let redis: RedisMock;
  let reader: RedisCacheReader;

  beforeEach(async () => {
    redis = new RedisMock();
    // ioredis-mock instances share one global in-memory store by default;
    // without this, state from an earlier test can leak into the next one.
    await redis.flushall();
    reader = new RedisCacheReader(redis as never, makeConfigService());
  });

  it("stores and retrieves a value for a resolve key", async () => {
    const value = { tag: "@daniel", wallet: "w" };
    await reader.set("tip:resolve:daniel", value);

    const result = await reader.get("tip:resolve:daniel");
    expect(result).toEqual(value);
  });

  it("returns undefined for a real cache miss", async () => {
    const result = await reader.get("tip:resolve:ghost");
    expect(result).toBeUndefined();
  });

  it("round-trips the CACHE_NEGATIVE sentinel", async () => {
    await reader.set("tip:resolve:ghost", CACHE_NEGATIVE, 30);

    const result = await reader.get("tip:resolve:ghost");
    expect(result).toBe(CACHE_NEGATIVE);
  });

  it("applies the given TTL override", async () => {
    await reader.set("tip:resolve:daniel", { tag: "@daniel" }, 30);

    const ttl = await redis.ttl("tip:resolve:daniel");
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30);
  });

  it("applies the configured default TTL when no override is given", async () => {
    await reader.set("tip:resolve:daniel", { tag: "@daniel" });

    const ttl = await redis.ttl("tip:resolve:daniel");
    expect(ttl).toBeGreaterThan(30);
    expect(ttl).toBeLessThanOrEqual(300);
  });

  it("never touches Redis for a non-resolve key (identity is not cached this stage)", async () => {
    await reader.set("identity:daniel", { tag: "@daniel" });
    const result = await reader.get("identity:daniel");

    expect(result).toBeUndefined();
    expect(await redis.get("identity:daniel")).toBeNull();
  });

  it("fails open on get(): a Redis error is treated as a cache miss", async () => {
    const brokenRedis = { get: () => Promise.reject(new Error("connection refused")) };
    const brokenReader = new RedisCacheReader(brokenRedis as never, makeConfigService());

    const result = await brokenReader.get("tip:resolve:daniel");
    expect(result).toBeUndefined();
  });

  it("fails open on set(): a Redis error does not throw", async () => {
    const brokenRedis = { set: () => Promise.reject(new Error("connection refused")) };
    const brokenReader = new RedisCacheReader(brokenRedis as never, makeConfigService());

    await expect(brokenReader.set("tip:resolve:daniel", { tag: "@daniel" })).resolves.toBeUndefined();
  });

  it("CROSS-APP KEY AGREEMENT: the key this class actually writes to Redis is byte-identical to @tip/core's buildResolveCacheKey output, the same function apps/indexer uses to delete it", async () => {
    const setSpy = vi.spyOn(redis, "set");
    const key = buildResolveCacheKey("tip:", "daniel" as never);

    await reader.set(key, { tag: "@daniel" });

    expect(setSpy).toHaveBeenCalledWith(key, expect.any(String), "EX", expect.any(Number));
  });
});
