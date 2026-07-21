import { schedule, type ScheduledTask } from "node-cron";

import type { Logger } from "./logger.js";
import type { ReconcileResult } from "./reconcile.js";

/**
 * Schedules the nightly (or configured) reconcile sweep. Runs alongside the
 * live subscription; if a sweep is somehow still running when the next tick
 * fires, node-cron will start another overlapping run, which is safe since
 * reconcile is idempotent.
 */
export function scheduleReconcile(deps: {
  cronExpression: string;
  logger: Logger;
  reconcile: () => Promise<ReconcileResult>;
}): ScheduledTask {
  return schedule(deps.cronExpression, () => {
    deps.logger.info({ cron: deps.cronExpression }, "nightly reconcile: starting");
    deps
      .reconcile()
      .catch((error: unknown) => {
        deps.logger.error({ err: error }, "nightly reconcile failed");
      });
  });
}
