import { address } from "@solana/kit";
import { normalizeTag } from "@tip/core";
import type { PrismaClient } from "@tip/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyChange } from "../src/apply-change.js";
import type { VerifiedTagChange } from "../src/decode-and-verify.js";
import type { CacheInvalidator } from "../src/cache-invalidator.js";

const OWNER = address("4wBqpZM9xaSheZzJSMawUKKwhdpChKbZ5eu5ky4Vigw");
const WALLET = address("EWmDvi3hhz86LYi2NcD6YUp18DeeB5gDkwJzde3MgF9A");

function normalizedTagOf(raw: string) {
  const result = normalizeTag(raw);
  if (!result.ok) {
    throw new Error(`expected ${raw} to normalize successfully`);
  }
  return result.tag;
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

function makeNoopCacheInvalidator(): CacheInvalidator {
  return { invalidate: vi.fn() };
}

// existingSlot === undefined means no row exists yet (a creation).
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

describe("applyChange: moderation gate status precedence", () => {
  it("a profane tag being CREATED is written with status: blocked", async () => {
    const db = makeFakeDb(undefined);
    const change = makeChange({ tag: normalizedTagOf("fuck") });

    const outcome = await applyChange(db, change, makeNoopCacheInvalidator(), makeFakeLogger());

    expect(outcome).toBe("created");
    expect(db.identity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "blocked" }),
    });
  });

  it("a clean tag being CREATED never sets status: the schema default (active) applies", async () => {
    const db = makeFakeDb(undefined);
    const change = makeChange({ tag: normalizedTagOf("daniel") });

    await applyChange(db, change, makeNoopCacheInvalidator(), makeFakeLogger());

    const [[{ data }]] = (db.identity.create as ReturnType<typeof vi.fn>).mock.calls;
    expect(data).not.toHaveProperty("status");
  });

  it("a profane tag being UPDATED is written with status: blocked, whatever the row's current status", async () => {
    const db = makeFakeDb(50n);
    const change = makeChange({ tag: normalizedTagOf("fuck"), slot: 100n });

    const outcome = await applyChange(db, change, makeNoopCacheInvalidator(), makeFakeLogger());

    expect(outcome).toBe("updated");
    expect(db.identity.updateMany).toHaveBeenCalledWith({
      where: { tag: "fuck", lastAppliedSlot: { lte: 100n } },
      data: expect.objectContaining({ status: "blocked" }),
    });
  });

  it("a clean tag being UPDATED never includes status in the write: an existing manual block cannot be reverted", async () => {
    const db = makeFakeDb(50n);
    const change = makeChange({ tag: normalizedTagOf("daniel"), slot: 100n });

    await applyChange(db, change, makeNoopCacheInvalidator(), makeFakeLogger());

    const [[{ data }]] = (db.identity.updateMany as ReturnType<typeof vi.fn>).mock.calls;
    expect(data).not.toHaveProperty("status");
  });

  it("a reserved name is not auto-blocked: the indexer's gate checks profanity only", async () => {
    const db = makeFakeDb(undefined);
    // "admin" is reserved (packages/core) but contains no profanity.
    const change = makeChange({ tag: normalizedTagOf("admin") });

    await applyChange(db, change, makeNoopCacheInvalidator(), makeFakeLogger());

    const [[{ data }]] = (db.identity.create as ReturnType<typeof vi.fn>).mock.calls;
    expect(data).not.toHaveProperty("status");
  });

  it("invalidates the cache on a status-changing update, same as any other applied change", async () => {
    const db = makeFakeDb(50n);
    const cacheInvalidator = makeNoopCacheInvalidator();
    const change = makeChange({ tag: normalizedTagOf("fuck"), slot: 100n });

    await applyChange(db, change, cacheInvalidator, makeFakeLogger());

    expect(cacheInvalidator.invalidate).toHaveBeenCalledWith("fuck");
  });
});

describe("applyChange: moderation gate fails safe", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("@tip/moderation");
  });

  it("a gate exception leaves the row unblocked (no status write) and logs a warning, never crashes", async () => {
    vi.doMock("@tip/moderation", () => ({
      isBlockedName: () => {
        throw new Error("engine exploded");
      },
    }));
    const { applyChange: applyChangeWithBrokenGate } = await import("../src/apply-change.js");

    const db = makeFakeDb(undefined);
    const logger = makeFakeLogger();
    const change = makeChange({ tag: normalizedTagOf("daniel") });

    const outcome = await applyChangeWithBrokenGate(db, change, makeNoopCacheInvalidator(), logger);

    expect(outcome).toBe("created");
    const [[{ data }]] = (db.identity.create as ReturnType<typeof vi.fn>).mock.calls;
    expect(data).not.toHaveProperty("status");
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ tag: "daniel" }), expect.stringContaining("threw"));
  });
});
