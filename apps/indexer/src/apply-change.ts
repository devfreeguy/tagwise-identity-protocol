import type { Prisma, PrismaClient } from "@tip/db";

import type { CacheInvalidator } from "./cache-invalidator.js";
import type { VerifiedTagChange } from "./decode-and-verify.js";
import type { Logger } from "./logger.js";
import { shouldBlockTag } from "./moderation-gate.js";

export type ApplyOutcome = "created" | "updated" | "skipped_stale";

/**
 * Upserts the on-chain fields of an Identity row, guarded so an older slot
 * never overwrites a newer one. tag, owner, wallet, bump, and lastAppliedSlot
 * are on-chain fields; the off-chain profile fields belong to the API and
 * are never touched here.
 *
 * status is the one exception, and its precedence is deliberate:
 * - If the tag fails the moderation gate (profanity only, see
 *   moderation-gate.ts), status is set to "blocked", whether the row is
 *   being created fresh or an existing row is being updated. This is
 *   idempotent: an already-blocked row simply stays blocked.
 * - If the tag PASSES the gate, status is left out of the write entirely,
 *   never set to "active" explicitly. On create, the schema's own default
 *   ("active") applies. On update, omitting the field means Postgres never
 *   touches that column, so an existing manual moderation decision (a row
 *   an admin blocked for a reason the automated gate cannot see) is never
 *   reverted to active by this code. The indexer may only ever move a row
 *   from active to blocked on its own, never the reverse.
 *
 * The update branch is a single conditional updateMany so the slot guard is
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
  const blocked = shouldBlockTag(change.tag, logger);

  const updateData: Prisma.IdentityUpdateManyMutationInput = {
    owner: change.owner,
    wallet: change.wallet,
    bump: change.bump,
    lastAppliedSlot: change.slot,
  };
  if (blocked) {
    updateData.status = "blocked";
  }

  const updateResult = await db.identity.updateMany({
    where: { tag: change.tag, lastAppliedSlot: { lte: change.slot } },
    data: updateData,
  });

  if (updateResult.count > 0) {
    logger.info({ tag: change.tag, slot: change.slot.toString(), blocked }, "applied tag update");
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

  const createData: Prisma.IdentityCreateInput = {
    tag: change.tag,
    owner: change.owner,
    wallet: change.wallet,
    bump: change.bump,
    lastAppliedSlot: change.slot,
  };
  if (blocked) {
    createData.status = "blocked";
  }

  await db.identity.create({ data: createData });
  logger.info({ tag: change.tag, slot: change.slot.toString(), blocked }, "created identity from tag account");
  await cacheInvalidator.invalidate(change.tag);
  return "created";
}
