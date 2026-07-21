import type { PrismaClient } from "@tip/db";

/**
 * Fixed singleton key for the single-row indexer_state cursor, matching the
 * convention documented in packages/db's schema.
 */
export const CURSOR_ID = "default";

/**
 * Advances indexer_state.lastProcessedSlot to slot, guarded the same way as
 * applyChange: never move the cursor backward. Called once per notification
 * or reconcile sweep, after the corresponding change has been applied.
 */
export async function advanceCursor(db: PrismaClient, slot: bigint): Promise<void> {
  const updateResult = await db.indexerState.updateMany({
    where: { id: CURSOR_ID, lastProcessedSlot: { lt: slot } },
    data: { lastProcessedSlot: slot },
  });

  if (updateResult.count > 0) {
    return;
  }

  const existing = await db.indexerState.findUnique({ where: { id: CURSOR_ID } });
  if (!existing) {
    await db.indexerState.create({ data: { id: CURSOR_ID, lastProcessedSlot: slot } });
  }
}
