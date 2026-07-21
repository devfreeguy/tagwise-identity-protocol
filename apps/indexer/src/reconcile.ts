import { address, type Base64EncodedBytes } from "@solana/kit";
import { TAG_ACCOUNT_DISCRIMINATOR } from "@tip/core";
import type { PrismaClient } from "@tip/db";

import type { CacheInvalidator } from "./cache-invalidator.js";
import type { Logger } from "./logger.js";
import { processAccountObservation } from "./pipeline.js";
import type { IndexerRpc } from "./rpc.js";

export type ReconcileResult = Readonly<{
  slot: bigint;
  scanned: number;
  applied: number;
  skipped: number;
}>;

/**
 * Fetches every tip_registry account at finalized commitment, filtered by a
 * memcmp on the TagAccount discriminator so only tag accounts return, and
 * runs each one through the same guarded pipeline used by the live
 * subscription. The program has no close instruction, so accounts never
 * disappear; reconcile only upserts, it never deletes. Used by startup
 * backfill, reconnect gap-healing, and the nightly cron job.
 */
export async function reconcile(deps: {
  rpc: IndexerRpc;
  db: PrismaClient;
  cacheInvalidator: CacheInvalidator;
  logger: Logger;
  programId: string;
}): Promise<ReconcileResult> {
  deps.logger.info({ programId: deps.programId }, "reconcile: starting full sweep");

  const discriminatorBase64 = Buffer.from(TAG_ACCOUNT_DISCRIMINATOR).toString("base64") as Base64EncodedBytes;

  const response = await deps.rpc
    .getProgramAccounts(address(deps.programId), {
      commitment: "finalized",
      encoding: "base64",
      withContext: true,
      filters: [
        {
          memcmp: {
            offset: 0n,
            bytes: discriminatorBase64,
            encoding: "base64",
          },
        },
      ],
    })
    .send();

  const slot = response.context.slot;
  let applied = 0;
  let skipped = 0;

  for (const item of response.value) {
    const data = Buffer.from(item.account.data[0], "base64");
    const outcome = await processAccountObservation({
      db: deps.db,
      cacheInvalidator: deps.cacheInvalidator,
      logger: deps.logger,
      programId: deps.programId,
      address: item.pubkey,
      data,
      slot,
    });
    if (outcome === "applied") {
      applied++;
    } else {
      skipped++;
    }
  }

  deps.logger.info(
    { slot: slot.toString(), scanned: response.value.length, applied, skipped },
    "reconcile: sweep complete",
  );

  return { slot, scanned: response.value.length, applied, skipped };
}
