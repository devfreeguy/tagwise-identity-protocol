import { buildResolveCacheKey } from "@tip/core";
import type { Identity, PrismaClient } from "@tip/db";
import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import type { ChainFallback } from "../src/tags/chain-fallback.js";
import { RedisCacheReader } from "../src/tags/redis-cache-reader.js";
import type { UpdateIdentityProvidedFields } from "../src/tags/tags.service.js";
import { TagsService } from "../src/tags/tags.service.js";

const OWNER = "OwnerPubkey11111111111111111111111111111";

const NO_FIELDS_PROVIDED: UpdateIdentityProvidedFields = {
  displayName: false,
  avatar: false,
  bio: false,
  preferredToken: false,
};

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
    owner: OWNER,
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
    },
  } as unknown as PrismaClient;
}

function makeFakeChainFallback() {
  return {
    lookup: vi.fn().mockResolvedValue(undefined),
  } as unknown as ChainFallback<Identity>;
}

describe("TagsService.updateIdentity cache invalidation", () => {
  let redis: RedisMock;
  let cache: RedisCacheReader;
  let config: ConfigService;

  beforeEach(async () => {
    config = makeConfigService();
    redis = new RedisMock();
    // ioredis-mock instances share one global in-memory store by default;
    // without this, state from an earlier test leaks into the next one.
    await redis.flushall();
    cache = new RedisCacheReader(redis as never, config);
  });

  it("a successful PATCH deletes the exact key buildResolveCacheKey produces for that tag", async () => {
    const db = makeFakeDb(makeIdentity({ owner: OWNER }));
    (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeIdentity({ owner: OWNER, displayName: "New Name" }),
    );
    const service = new TagsService(db, cache, makeFakeChainFallback(), config);

    const key = buildResolveCacheKey("tip:", "daniel" as never);
    await redis.set(key, JSON.stringify({ tag: "@daniel", displayName: "Old Name" }), "EX", 300);
    expect(await redis.get(key)).not.toBeNull();

    await service.updateIdentity({
      tag: "daniel" as never,
      ownerPubkey: OWNER,
      dto: { displayName: "New Name" },
      provided: { ...NO_FIELDS_PROVIDED, displayName: true },
    });

    expect(await redis.get(key)).toBeNull();
  });

  it("resolve after a PATCH returns the updated values, not the cached stale ones", async () => {
    const db = makeFakeDb(makeIdentity({ owner: OWNER, displayName: "Old Name", wallet: "WalletPubkey1111111111111111111111111111" }));
    const service = new TagsService(db, cache, makeFakeChainFallback(), config);

    // Populate the resolve cache with the old value.
    const stale = await service.resolve("daniel" as never);
    expect(stale.displayName).toBe("Old Name");

    (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeIdentity({ owner: OWNER, displayName: "New Name", wallet: "WalletPubkey1111111111111111111111111111" }),
    );
    await service.updateIdentity({
      tag: "daniel" as never,
      ownerPubkey: OWNER,
      dto: { displayName: "New Name" },
      provided: { ...NO_FIELDS_PROVIDED, displayName: true },
    });

    // The mirror row itself must also reflect the update for a fresh resolve.
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeIdentity({ owner: OWNER, displayName: "New Name", wallet: "WalletPubkey1111111111111111111111111111" }),
    );

    const fresh = await service.resolve("daniel" as never);
    expect(fresh.displayName).toBe("New Name");
  });

  it("a Redis failure during invalidation still returns 200 with the updated body", async () => {
    const brokenRedis = { del: () => Promise.reject(new Error("connection refused")) };
    const brokenCache = new RedisCacheReader(brokenRedis as never, config);

    const db = makeFakeDb(makeIdentity({ owner: OWNER }));
    (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeIdentity({ owner: OWNER, displayName: "New Name" }),
    );
    const service = new TagsService(db, brokenCache, makeFakeChainFallback(), config);

    const result = await service.updateIdentity({
      tag: "daniel" as never,
      ownerPubkey: OWNER,
      dto: { displayName: "New Name" },
      provided: { ...NO_FIELDS_PROVIDED, displayName: true },
    });

    expect(result.displayName).toBe("New Name");
  });

  it("a failed database write does not invalidate the cache", async () => {
    const db = makeFakeDb(makeIdentity({ owner: OWNER }));
    (db.identity.update as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("db write failed"));
    const service = new TagsService(db, cache, makeFakeChainFallback(), config);

    const key = buildResolveCacheKey("tip:", "daniel" as never);
    await redis.set(key, JSON.stringify({ tag: "@daniel", displayName: "Still Valid" }), "EX", 300);

    await expect(
      service.updateIdentity({
        tag: "daniel" as never,
        ownerPubkey: OWNER,
        dto: { displayName: "New Name" },
        provided: { ...NO_FIELDS_PROVIDED, displayName: true },
      }),
    ).rejects.toThrow("db write failed");

    const stillCached = await redis.get(key);
    expect(stillCached).not.toBeNull();
    expect(JSON.parse(stillCached as string)).toEqual({ tag: "@daniel", displayName: "Still Valid" });
  });
});
