import { ServiceUnavailableException } from "@nestjs/common";
import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { RedisNonceStore } from "../src/auth/redis-nonce-store.js";

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.TIP_REGISTRY_PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
  process.env.REDIS_URL = "redis://unused/for-tests";
  return new ConfigService();
}

describe("RedisNonceStore", () => {
  let redis: RedisMock;
  let store: RedisNonceStore;

  beforeEach(() => {
    redis = new RedisMock();
    store = new RedisNonceStore(redis as never, makeConfigService());
  });

  it("put then take returns the nonce record", async () => {
    await store.put("owner1", "nonceA", 300);

    const result = await store.take("owner1", "nonceA");

    expect(result).not.toBeNull();
    expect(result?.pubkey).toBe("owner1");
    expect(result?.nonce).toBe("nonceA");
  });

  it("REPLAY: take twice returns null the second time", async () => {
    await store.put("owner1", "nonceA", 300);

    const first = await store.take("owner1", "nonceA");
    const second = await store.take("owner1", "nonceA");

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("returns null for a wrong nonce", async () => {
    await store.put("owner1", "nonceA", 300);

    const result = await store.take("owner1", "wrong-nonce");

    expect(result).toBeNull();
    // The real nonce must still be untouched by the failed attempt.
    expect(await store.take("owner1", "nonceA")).not.toBeNull();
  });

  it("returns null for the right nonce but wrong pubkey", async () => {
    await store.put("owner1", "nonceA", 300);

    const result = await store.take("owner2", "nonceA");

    expect(result).toBeNull();
  });

  it("does not return an expired nonce", async () => {
    await store.put("owner1", "nonceA", 1);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const result = await store.take("owner1", "nonceA");
    expect(result).toBeNull();
  });

  it("CONCURRENCY: two simultaneous take() calls for the same nonce, exactly one succeeds", async () => {
    await store.put("owner1", "nonceA", 300);

    const [a, b] = await Promise.all([store.take("owner1", "nonceA"), store.take("owner1", "nonceA")]);

    const successes = [a, b].filter((result) => result !== null);
    expect(successes).toHaveLength(1);
  });

  it("multiple live nonces per pubkey: two challenges are both independently redeemable", async () => {
    await store.put("owner1", "nonceA", 300);
    await store.put("owner1", "nonceB", 300);

    const resultA = await store.take("owner1", "nonceA");
    const resultB = await store.take("owner1", "nonceB");

    expect(resultA).not.toBeNull();
    expect(resultB).not.toBeNull();
  });

  it("issuing a second challenge does not invalidate the first (no denial of service)", async () => {
    await store.put("owner1", "nonceA", 300);
    // A second challenge for the same pubkey must not evict the first.
    await store.put("owner1", "nonceB", 300);

    const resultA = await store.take("owner1", "nonceA");
    expect(resultA).not.toBeNull();
  });

  it("put() fails closed with 503 when Redis is unreachable", async () => {
    const brokenRedis = {
      set: () => Promise.reject(new Error("connection refused")),
      getdel: () => Promise.reject(new Error("connection refused")),
    };
    const brokenStore = new RedisNonceStore(brokenRedis as never, makeConfigService());

    await expect(brokenStore.put("owner1", "nonceA", 300)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("take() fails closed with 503 when Redis is unreachable", async () => {
    const brokenRedis = {
      set: () => Promise.reject(new Error("connection refused")),
      getdel: () => Promise.reject(new Error("connection refused")),
    };
    const brokenStore = new RedisNonceStore(brokenRedis as never, makeConfigService());

    await expect(brokenStore.take("owner1", "nonceA")).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
