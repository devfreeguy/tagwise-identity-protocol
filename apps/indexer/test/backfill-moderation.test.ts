import type { PrismaClient } from "@tip/db";
import { describe, expect, it, vi } from "vitest";

import { backfillModerationGate } from "../src/backfill-moderation.js";
import type { CacheInvalidator } from "../src/cache-invalidator.js";

type Row = { tag: string; status: "active" | "blocked" };

/**
 * A tiny stateful fake, unlike the plain mocks elsewhere in this suite,
 * specifically so the idempotency assertion (a second run does nothing) is
 * a real behavioral test rather than an assumption: the same fake db
 * instance carries the mutation from the first run into the second.
 */
function makeStatefulFakeDb(initialRows: Row[]) {
  const rows = new Map(initialRows.map((row) => [row.tag, { ...row }]));

  return {
    identity: {
      findMany: vi.fn(async ({ where }: { where: { status: "active" | "blocked" } }) => {
        return Array.from(rows.values())
          .filter((row) => row.status === where.status)
          .map((row) => ({ tag: row.tag }));
      }),
      updateMany: vi.fn(async ({ where, data }: { where: { tag: string; status: string }; data: { status: "active" | "blocked" } }) => {
        const row = rows.get(where.tag);
        if (!row || row.status !== where.status) {
          return { count: 0 };
        }
        row.status = data.status;
        return { count: 1 };
      }),
    },
  } as unknown as PrismaClient;
}

function makeFakeCacheInvalidator(): CacheInvalidator & { invalidated: string[] } {
  const invalidated: string[] = [];
  return {
    invalidated,
    invalidate: vi.fn((tag: string) => {
      invalidated.push(tag);
    }),
  };
}

function makeFakeLogger() {
  return { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() } as never;
}

describe("backfillModerationGate", () => {
  it("blocks only the failing active rows; clean, reserved, and already-blocked rows are untouched", async () => {
    const db = makeStatefulFakeDb([
      { tag: "daniel", status: "active" }, // clean, stays active
      { tag: "fuck", status: "active" }, // profane, should flip
      { tag: "admin", status: "active" }, // reserved but clean, stays active (not auto-blocked)
      { tag: "shit", status: "blocked" }, // already blocked, must never be read or touched
    ]);
    const cacheInvalidator = makeFakeCacheInvalidator();

    const result = await backfillModerationGate({ db, cacheInvalidator, logger: makeFakeLogger() });

    expect(result).toEqual({ checked: 3, blocked: 1 });
    expect(cacheInvalidator.invalidated).toEqual(["fuck"]);
  });

  it("is idempotent: running it again after a successful pass finds nothing left to block", async () => {
    const db = makeStatefulFakeDb([
      { tag: "daniel", status: "active" },
      { tag: "fuck", status: "active" },
      { tag: "admin", status: "active" },
    ]);
    const cacheInvalidator = makeFakeCacheInvalidator();
    const logger = makeFakeLogger();

    const first = await backfillModerationGate({ db, cacheInvalidator, logger });
    expect(first).toEqual({ checked: 3, blocked: 1 });

    const second = await backfillModerationGate({ db, cacheInvalidator, logger });
    expect(second).toEqual({ checked: 2, blocked: 0 });
  });

  it("never un-blocks: a row that is already blocked stays blocked across repeated runs", async () => {
    const db = makeStatefulFakeDb([{ tag: "shit", status: "blocked" }]);
    const cacheInvalidator = makeFakeCacheInvalidator();
    const logger = makeFakeLogger();

    await backfillModerationGate({ db, cacheInvalidator, logger });
    await backfillModerationGate({ db, cacheInvalidator, logger });

    const rows = await db.identity.findMany({ where: { status: "blocked" }, select: { tag: true } });
    expect(rows).toEqual([{ tag: "shit" }]);
    expect(cacheInvalidator.invalidated).toEqual([]);
  });
});
