import type { Address } from "@solana/kit";
import type { PrismaClient } from "@tip/db";

import { applyChange } from "./apply-change.js";
import type { CacheInvalidator } from "./cache-invalidator.js";
import { advanceCursor } from "./cursor.js";
import { decodeAndVerify } from "./decode-and-verify.js";
import type { Logger } from "./logger.js";

/**
 * Runs the full pipeline for a single account observation: decode and
 * verify, apply the guarded mirror upsert, invalidate the cache seam, and
 * advance the cursor. Shared by the live subscription, startup backfill, and
 * reconcile, so all three paths behave identically.
 */
export async function processAccountObservation(deps: {
  db: PrismaClient;
  cacheInvalidator: CacheInvalidator;
  logger: Logger;
  programId: string;
  address: Address;
  data: Uint8Array;
  slot: bigint;
}): Promise<"applied" | "skipped"> {
  const result = await decodeAndVerify({
    address: deps.address,
    data: deps.data,
    slot: deps.slot,
    programId: deps.programId,
  });

  if (!result.ok) {
    deps.logger.warn({ address: deps.address, reason: result.reason }, "rejected account observation");
    return "skipped";
  }

  const outcome = await applyChange(deps.db, result.change, deps.cacheInvalidator, deps.logger);
  if (outcome !== "skipped_stale") {
    await advanceCursor(deps.db, deps.slot);
  }
  return outcome === "skipped_stale" ? "skipped" : "applied";
}
