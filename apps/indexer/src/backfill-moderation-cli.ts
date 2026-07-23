import { createDbClient } from "@tip/db";

import { backfillModerationGate } from "./backfill-moderation.js";
import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { createRedisClient } from "./redis.js";
import { RedisCacheInvalidator } from "./redis-cache-invalidator.js";

/**
 * One-shot entry point for the PART 3 backfill: connects, runs the gate over
 * every currently active row once, reports counts, disconnects, and exits.
 * Not part of the long-running server in main.ts; run explicitly via
 * `pnpm --filter @tip/indexer backfill:moderation` (or the built
 * dist/backfill-moderation-cli.js directly) after deploying the moderation
 * gate, and safe to run again any time since it is idempotent.
 */
async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDbClient(config.databaseUrl);
  const redis = createRedisClient(config, logger);
  const cacheInvalidator = new RedisCacheInvalidator(redis, config, logger);

  logger.info("moderation backfill: starting");
  const result = await backfillModerationGate({ db, cacheInvalidator, logger });
  logger.info(result, "moderation backfill: done");

  await db.$disconnect();
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
}

main().catch((error: unknown) => {
  logger.error({ err: error }, "moderation backfill failed");
  process.exitCode = 1;
});
