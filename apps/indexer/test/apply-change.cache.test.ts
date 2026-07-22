import { address } from "@solana/kit";
import { buildResolveCacheKey, normalizeTag } from "@tip/core";
import type { PrismaClient } from "@tip/db";
import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyChange } from "../src/apply-change.js";
import type { IndexerConfig } from "../src/config.js";
import { RedisCacheInvalidator } from "../src/redis-cache-invalidator.js";
import type { VerifiedTagChange } from "../src/decode-and-verify.js";

const OWNER = address("4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw");
const WALLET = address("EWmDvi3hhz86LYi2NcD6YUp18DeeB5gDkwJzde3MgF9A");

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
  return { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() } as never;
}

function makeChange(overrides: Partial<VerifiedTagChange> = {}): VerifiedTagChange {
  return {
    address: address("11111111111111111111111111111111"),
    tag: normalizedTagOf("freshtag"),
    owner: OWNER,
    wallet: WALLET,
    bump: 253,
    slot: 100n,
    ...overrides,
  };
}

describe("applyChange cache invalidation (integration with RedisCacheInvalidator)", () => {
  let redis: RedisMock;
  let config: IndexerConfig;
  let cacheInvalidator: RedisCacheInvalidator;

  beforeEach(async () => {
    redis = new RedisMock();
    await redis.flushall();
    config = makeConfig();
    cacheInvalidator = new RedisCacheInvalidator(redis as never, config, makeFakeLogger());
  });

  function makeFakeDb(existingSlot: bigint | undefined) {
    return {
      identity: {
        updateMany: vi.fn().mockImplementation(({ where }: { where: { lastAppliedSlot: { lte: bigint } } }) => {
          if (existingSlot === undefined || existingSlot <= where.lastAppliedSlot.lte) {
            return Promise.resolve({ count: existingSlot === undefined ? 0 : 1 });
          }
          return Promise.resolve({ count: 0 });
        }),
        findUnique: vi.fn().mockResolvedValue(existingSlot === undefined ? null : { lastAppliedSlot: existingSlot }),
        create: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as PrismaClient;
  }

  it("a CREATION deletes the negative cache entry left by an earlier not-found lookup: the single most important case", async () => {
    const tag = normalizedTagOf("freshtag");
    const key = buildResolveCacheKey(config.redisKeyPrefix, tag);
    // Simulate: someone checked resolve/availability for this tag before it
    // was registered, caching a negative (not found) result.
    await redis.set(key, "__TIP_CACHE_NEGATIVE__");
    expect(await redis.get(key)).not.toBeNull();

    const db = makeFakeDb(undefined); // no existing row: this is a creation
    const change = makeChange({ tag });

    const outcome = await applyChange(db, change, cacheInvalidator, makeFakeLogger());

    expect(outcome).toBe("created");
    // Without this, a tag just registered would keep returning not-found
    // for the rest of the negative TTL.
    expect(await redis.get(key)).toBeNull();
  });

  it("an applied UPDATE deletes the exact key derived from @tip/core", async () => {
    const tag = normalizedTagOf("daniel");
    const key = buildResolveCacheKey(config.redisKeyPrefix, tag);
    await redis.set(key, JSON.stringify({ tag: "@daniel", wallet: "old" }));

    const db = makeFakeDb(50n); // existing row at an older slot: this is an update
    const change = makeChange({ tag, slot: 100n });

    const outcome = await applyChange(db, change, cacheInvalidator, makeFakeLogger());

    expect(outcome).toBe("updated");
    expect(await redis.get(key)).toBeNull();
  });

  it("a skipped stale change deletes nothing", async () => {
    const tag = normalizedTagOf("daniel");
    const key = buildResolveCacheKey(config.redisKeyPrefix, tag);
    await redis.set(key, JSON.stringify({ tag: "@daniel", wallet: "current" }));

    const db = makeFakeDb(200n); // existing row at a NEWER slot than the incoming change
    const change = makeChange({ tag, slot: 100n });

    const outcome = await applyChange(db, change, cacheInvalidator, makeFakeLogger());

    expect(outcome).toBe("skipped_stale");
    // The cache entry must survive untouched: nothing was actually applied.
    expect(await redis.get(key)).toBe(JSON.stringify({ tag: "@daniel", wallet: "current" }));
  });
});
