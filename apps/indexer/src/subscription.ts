import { address } from "@solana/kit";
import type { PrismaClient } from "@tip/db";

import type { CacheInvalidator } from "./cache-invalidator.js";
import type { IndexerConfig } from "./config.js";
import type { Logger } from "./logger.js";
import { processAccountObservation } from "./pipeline.js";
import type { ReconcileResult } from "./reconcile.js";
import type { IndexerRpcSubscriptions } from "./rpc.js";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribes to tip_registry program account notifications and runs the
 * pipeline on each one. On any websocket close or error, reconnects with
 * capped exponential backoff and, on every successful reconnect, runs a full
 * reconcile sweep, because events during the disconnect were missed. The
 * live stream is never assumed to be lossless.
 *
 * Authoritative writes use finalized commitment (or whatever COMMITMENT is
 * configured), so state reorgs below that commitment level are not a
 * concern here.
 */
export async function runLiveSubscription(deps: {
  rpcSubscriptions: IndexerRpcSubscriptions;
  db: PrismaClient;
  cacheInvalidator: CacheInvalidator;
  logger: Logger;
  config: IndexerConfig;
  abortSignal: AbortSignal;
  reconcile: () => Promise<ReconcileResult>;
}): Promise<void> {
  let backoffMs = INITIAL_BACKOFF_MS;
  let firstConnection = true;

  while (!deps.abortSignal.aborted) {
    try {
      const notifications = await deps.rpcSubscriptions
        .programNotifications(address(deps.config.programId), {
          commitment: deps.config.commitment,
          encoding: "base64",
        })
        .subscribe({ abortSignal: deps.abortSignal });

      deps.logger.info({ programId: deps.config.programId }, "subscribed to program notifications");
      backoffMs = INITIAL_BACKOFF_MS;

      if (!firstConnection) {
        deps.logger.info("running gap-heal reconcile after reconnect");
        await deps.reconcile();
      }
      firstConnection = false;

      for await (const notification of notifications) {
        const slot = notification.context.slot;
        const data = Buffer.from(notification.value.account.data[0], "base64");
        await processAccountObservation({
          db: deps.db,
          cacheInvalidator: deps.cacheInvalidator,
          logger: deps.logger,
          programId: deps.config.programId,
          address: notification.value.pubkey,
          data,
          slot,
        });
      }

      deps.logger.warn("subscription stream ended, reconnecting");
    } catch (error) {
      if (deps.abortSignal.aborted) {
        break;
      }
      deps.logger.warn({ err: error }, "subscription disconnected, will reconnect after backoff");
    }

    if (deps.abortSignal.aborted) {
      break;
    }

    await sleep(backoffMs);
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
  }

  deps.logger.info("live subscription loop stopped");
}
