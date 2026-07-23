import type { NormalizedTag } from "@tip/core";
import type { PrismaClient } from "@tip/db";

import type { CacheInvalidator } from "./cache-invalidator.js";
import type { Logger } from "./logger.js";
import { shouldBlockTag } from "./moderation-gate.js";

export type BackfillResult = Readonly<{ checked: number; blocked: number }>;

/**
 * One-time backfill for rows mirrored before the moderation gate existed on
 * this path: re-runs the same profanity-only gate (see moderation-gate.ts)
 * over every currently active row and blocks the ones that fail it.
 *
 * Only ever moves active to blocked, never the reverse: the query itself is
 * scoped to status: "active", so an already-blocked row is never read,
 * never re-checked, and never touched, exactly like the live/reconcile path
 * in apply-change.ts. This is what makes running it repeatedly safe: a
 * second run only ever finds rows that are still active, which after a
 * first successful run means nothing left to block.
 *
 * Reserved names are not checked here either, for the same reason
 * apply-change.ts does not check them: a reserved tag mirrored from chain
 * is either the protocol's own or outside this layer's remit, never
 * something this backfill should flip.
 */
export async function backfillModerationGate(deps: {
  db: PrismaClient;
  cacheInvalidator: CacheInvalidator;
  logger: Logger;
}): Promise<BackfillResult> {
  const activeRows = await deps.db.identity.findMany({
    where: { status: "active" },
    select: { tag: true },
  });

  let blocked = 0;
  for (const row of activeRows) {
    const tag = row.tag as NormalizedTag;
    if (!shouldBlockTag(tag, deps.logger)) {
      continue;
    }

    const result = await deps.db.identity.updateMany({
      where: { tag: row.tag, status: "active" },
      data: { status: "blocked" },
    });
    if (result.count === 0) {
      // Lost a race with a concurrent write between the read above and
      // this update (for example a manual moderation action); nothing to
      // invalidate or count, the row is no longer in the state this
      // backfill is meant to act on.
      continue;
    }

    await deps.cacheInvalidator.invalidate(row.tag);
    blocked++;
    deps.logger.warn({ tag: row.tag }, "backfill: blocked existing active identity, failed moderation gate");
  }

  const result: BackfillResult = { checked: activeRows.length, blocked };
  deps.logger.info(result, "backfill: moderation gate sweep complete");
  return result;
}
