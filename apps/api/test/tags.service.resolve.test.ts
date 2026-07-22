import { buildResolveCacheKey } from "@tip/core";
import type { Identity, PrismaClient } from "@tip/db";
import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChainFallback } from "../src/tags/chain-fallback.js";
import { ConfigService } from "../src/config/config.service.js";
import { RedisCacheReader } from "../src/tags/redis-cache-reader.js";
import { TagsService } from "../src/tags/tags.service.js";

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.PAYMENT_LINK_BASE_URL = "https://tagwise.me";
  process.env.TIP_REGISTRY_PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
  process.env.REDIS_URL = "redis://unused/for-tests";
  process.env.REDIS_KEY_PREFIX = "tip:";
  process.env.RESOLVE_CACHE_TTL = "300";
  process.env.RESOLVE_CACHE_NEGATIVE_TTL = "30";
  return new ConfigService();
}

function makeIdentity(overrides: Partial<Identity> = {}): Identity {
  return {
    id: "019f0000-0000-7000-8000-000000000000",
    tag: "daniel",
    owner: "OwnerPubkey11111111111111111111111111111",
    wallet: "WalletPubkey1111111111111111111111111111",
    bump: 254,
    displayName: "Daniel",
    avatar: null,
    bio: null,
    preferredToken: null,
    verified: false,
    merchant: false,
    status: "active",
    lastAppliedSlot: 100n,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeFakeDb(row: Identity | null) {
  return {
    identity: {
      findUnique: vi.fn().mockResolvedValue(row),
      update: vi.fn(),
      create: vi.fn(),
    },
  } as unknown as PrismaClient;
}

function makeFakeChainFallback(result: Identity | undefined) {
  return {
    lookup: vi.fn().mockResolvedValue(result),
  } as unknown as ChainFallback<Identity> & { lookup: ReturnType<typeof vi.fn> };
}

describe("TagsService.resolve (Redis-backed cache and chain fallback)", () => {
  let redis: RedisMock;
  let cache: RedisCacheReader;
  let config: ConfigService;

  beforeEach(async () => {
    config = makeConfigService();
    redis = new RedisMock();
    // ioredis-mock instances share one global in-memory store by default
    // (as if every `new Redis()` connected to the same real server), so
    // without this, state from an earlier test leaks into the next one.
    await redis.flushall();
    cache = new RedisCacheReader(redis as never, config);
  });

  it("cache miss reads the mirror and populates the cache", async () => {
    const db = makeFakeDb(makeIdentity());
    const chainFallback = makeFakeChainFallback(undefined);
    const service = new TagsService(db, cache, chainFallback, config);

    const result = await service.resolve("daniel" as never);

    expect(result.tag).toBe("@daniel");
    expect(db.identity.findUnique).toHaveBeenCalledTimes(1);

    const key = buildResolveCacheKey("tip:", "daniel" as never);
    const stored = await redis.get(key);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual(result);
  });

  it("a second read is served from cache without hitting the mirror", async () => {
    const db = makeFakeDb(makeIdentity());
    const chainFallback = makeFakeChainFallback(undefined);
    const service = new TagsService(db, cache, chainFallback, config);

    await service.resolve("daniel" as never);
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockClear();

    const second = await service.resolve("daniel" as never);

    expect(second.tag).toBe("@daniel");
    expect(db.identity.findUnique).not.toHaveBeenCalled();
  });

  it("caches a negative result with the shorter negative TTL", async () => {
    const db = makeFakeDb(null);
    const chainFallback = makeFakeChainFallback(undefined);
    const service = new TagsService(db, cache, chainFallback, config);

    await expect(service.resolve("ghost" as never)).rejects.toThrow();

    const key = buildResolveCacheKey("tip:", "ghost" as never);
    const ttl = await redis.ttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30);
  });

  it("a cached negative returns 404 without a mirror query", async () => {
    const db = makeFakeDb(null);
    const chainFallback = makeFakeChainFallback(undefined);
    const service = new TagsService(db, cache, chainFallback, config);

    await expect(service.resolve("ghost" as never)).rejects.toThrow();
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockClear();
    (chainFallback.lookup as ReturnType<typeof vi.fn>).mockClear();

    await expect(service.resolve("ghost" as never)).rejects.toThrow();

    expect(db.identity.findUnique).not.toHaveBeenCalled();
    expect(chainFallback.lookup).not.toHaveBeenCalled();
  });

  it("a blocked row never caches as resolvable and never consults the chain fallback", async () => {
    const db = makeFakeDb(makeIdentity({ status: "blocked" }));
    const chainFallback = makeFakeChainFallback(undefined);
    const service = new TagsService(db, cache, chainFallback, config);

    await expect(service.resolve("daniel" as never)).rejects.toThrow();

    expect(chainFallback.lookup).not.toHaveBeenCalled();

    const key = buildResolveCacheKey("tip:", "daniel" as never);
    const stored = await redis.get(key);
    expect(stored).toBe("__TIP_CACHE_NEGATIVE__");
  });

  it("falls through to the mirror when Redis is unreachable (fails open)", async () => {
    const brokenRedis = {
      get: () => Promise.reject(new Error("connection refused")),
      set: () => Promise.reject(new Error("connection refused")),
    };
    const brokenCache = new RedisCacheReader(brokenRedis as never, config);
    const db = makeFakeDb(makeIdentity());
    const chainFallback = makeFakeChainFallback(undefined);
    const service = new TagsService(db, brokenCache, chainFallback, config);

    const result = await service.resolve("daniel" as never);

    expect(result.tag).toBe("@daniel");
    expect(db.identity.findUnique).toHaveBeenCalledTimes(1);
  });

  it("chain fallback fires only on a mirror miss, returns on-chain fields with null profile fields, and never writes the mirror", async () => {
    const db = makeFakeDb(null);
    const chainFallback = makeFakeChainFallback(
      makeIdentity({
        displayName: null,
        avatar: null,
        bio: null,
        preferredToken: null,
        verified: false,
        merchant: false,
      }),
    );
    const service = new TagsService(db, cache, chainFallback, config);

    const result = await service.resolve("daniel" as never);

    expect(chainFallback.lookup).toHaveBeenCalledTimes(1);
    expect(result.displayName).toBeNull();
    expect(result.avatar).toBeNull();
    expect(result.preferredToken).toBeNull();
    expect(db.identity.update).not.toHaveBeenCalled();
    expect(db.identity.create).not.toHaveBeenCalled();
  });

  it("does not consult the chain fallback when the mirror already has an active row", async () => {
    const db = makeFakeDb(makeIdentity());
    const chainFallback = makeFakeChainFallback(makeIdentity());
    const service = new TagsService(db, cache, chainFallback, config);

    await service.resolve("daniel" as never);

    expect(chainFallback.lookup).not.toHaveBeenCalled();
  });
});
