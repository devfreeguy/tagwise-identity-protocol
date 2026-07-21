import { createDbClient } from "@tip/db";

import { NoopCacheInvalidator } from "./cache-invalidator.js";
import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { reconcile } from "./reconcile.js";
import { createRpcClients } from "./rpc.js";
import { scheduleReconcile } from "./scheduler.js";
import { runLiveSubscription } from "./subscription.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDbClient(config.databaseUrl);
  const { rpc, rpcSubscriptions } = createRpcClients(config);
  const cacheInvalidator = new NoopCacheInvalidator(logger);

  const runReconcile = () => reconcile({ rpc, db, cacheInvalidator, logger, programId: config.programId });

  logger.info({ programId: config.programId, commitment: config.commitment }, "tip-indexer starting");

  // Backfill on startup: catch the mirror up to current chain state before
  // the live subscription begins, covering anything that happened while the
  // worker was down.
  logger.info("running startup backfill reconcile");
  await runReconcile();

  const abortController = new AbortController();

  const subscriptionPromise = runLiveSubscription({
    rpcSubscriptions,
    db,
    cacheInvalidator,
    logger,
    config,
    abortSignal: abortController.signal,
    reconcile: runReconcile,
  });

  const cronTask = scheduleReconcile({
    cronExpression: config.reconcileCron,
    logger,
    reconcile: runReconcile,
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, "shutting down");
    abortController.abort();
    void cronTask.stop();

    void subscriptionPromise
      .catch((error: unknown) => {
        logger.warn({ err: error }, "subscription loop ended with an error during shutdown");
      })
      .finally(() => {
        void db
          .$disconnect()
          .catch((error: unknown) => {
            logger.warn({ err: error }, "error disconnecting db client");
          })
          .finally(() => {
            logger.info("shutdown complete");
            process.exit(0);
          });
      });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await subscriptionPromise;
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "tip-indexer failed to start");
  process.exitCode = 1;
});
