import type { PrismaClient } from "@tip/db";

import type { CacheInvalidator } from "./cache-invalidator.js";
import type { VerifiedTagChange } from "./decode-and-verify.js";
import type { Logger } from "./logger.js";

export type ApplyOutcome = "created" | "updated" | "skipped_stale";

/**
 * Upserts the on-chain fields of an Identity row, guarded so an older slot
 * never overwrites a newer one. Only tag, owner, wallet, bump, and
 * lastAppliedSlot are written here; the off-chain profile fields and status
 * belong to the API and are never touched by the indexer.
 *
 * The update branch is a single conditional updateMany so the guard is
 * enforced atomically by Postgres rather than by a separate read-then-write
 * in application code. Only one indexer instance is expected to run at a
 * time (see README), so the brief window between a failed guarded update and
 * the fallback create is not a concern in normal operation.
 */
export async function applyChange(
  db: PrismaClient,
  change: VerifiedTagChange,
  cacheInvalidator: CacheInvalidator,
  logger: Logger,
): Promise<ApplyOutcome> {
  const updateResult = await db.identity.updateMany({
    where: { tag: change.tag, lastAppliedSlot: { lte: change.slot } },
    data: {
      owner: change.owner,
      wallet: change.wallet,
      bump: change.bump,
      lastAppliedSlot: change.slot,
    },
  });

  if (updateResult.count > 0) {
    logger.info({ tag: change.tag, slot: change.slot.toString() }, "applied tag update");
    await cacheInvalidator.invalidate(change.tag);
    return "updated";
  }

  const existing = await db.identity.findUnique({
    where: { tag: change.tag },
    select: { lastAppliedSlot: true },
  });

  if (existing) {
    logger.warn(
      { tag: change.tag, incomingSlot: change.slot.toString(), storedSlot: existing.lastAppliedSlot.toString() },
      "skipped stale change, incoming slot is older than the stored slot",
    );
    return "skipped_stale";
  }

  await db.identity.create({
    data: {
      tag: change.tag,
      owner: change.owner,
      wallet: change.wallet,
      bump: change.bump,
      lastAppliedSlot: change.slot,
    },
  });
  logger.info({ tag: change.tag, slot: change.slot.toString() }, "created identity from tag account");
  await cacheInvalidator.invalidate(change.tag);
  return "created";
}
