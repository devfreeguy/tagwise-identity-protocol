import "reflect-metadata";

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Global, Module } from "@nestjs/common";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule } from "@nestjs/swagger";
import { Test } from "@nestjs/testing";

import { AppModule } from "../app.module.js";
import { apiDocumentOptions, createApiDocumentConfig } from "./document-config.js";
import { DB_CLIENT, DbModule } from "../db/db.module.js";
import { RedisThrottlerStorage } from "../redis/redis-throttler-storage.js";
import { REDIS_CLIENT, type ApiRedis } from "../redis/redis.js";
import { RedisModule } from "../redis/redis.module.js";

// Written to apps/api/openapi.json, the one path both this script and
// apps/docs' reference generator agree on. Regenerated on every docs build,
// never hand-edited, never committed as a build artifact (see apps/api's
// .gitignore).
const OUTPUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../../openapi.json");

/**
 * Stands in for DbModule during spec generation. The real DbModule's
 * DbClientHolder calls $connect() in onModuleInit, which Nest runs
 * unconditionally as part of app.init(), so overriding only the DB_CLIENT
 * token would not be enough: DbClientHolder itself would still be
 * instantiated and still attempt a real Postgres connection (see the same
 * reasoning in apps/api/test/app-bootstrap.test.ts). Replacing the whole
 * module removes DbClientHolder from the graph entirely, so no connection
 * is ever attempted, and no real DATABASE_URL is ever needed.
 */
@Global()
@Module({
  providers: [{ provide: DB_CLIENT, useValue: {} }],
  exports: [DB_CLIENT],
})
class StubDbModule {}

function createStubRedisClient(): ApiRedis {
  // The only method any provider calls on this client before a real request
  // comes in is RedisThrottlerStorage's constructor-time defineCommand();
  // everything else only runs inside a request handler, which spec
  // generation never exercises.
  return { defineCommand() {} } as unknown as ApiRedis;
}

/**
 * Stands in for RedisModule during spec generation, for the same reason as
 * StubDbModule: a real `new Redis(url)` would attempt an actual TCP
 * connection (non-fatal, ioredis retries in the background rather than
 * throwing, but it is still a real network attempt, which the no-network
 * requirement for this script rules out). RedisThrottlerStorage is kept as
 * the real class, constructed against the stub client above, since its
 * constructor only calls defineCommand(), a local, synchronous operation.
 */
@Global()
@Module({
  providers: [{ provide: REDIS_CLIENT, useValue: createStubRedisClient() }, RedisThrottlerStorage],
  exports: [REDIS_CLIENT, RedisThrottlerStorage],
})
class StubRedisModule {}

/**
 * Placeholder values, never real credentials: ConfigService.requireEnv()
 * fails fast if these are unset, but nothing in this script ever uses them
 * to open a real connection, since DbModule and RedisModule are replaced
 * above before AppModule is compiled.
 */
function setPlaceholderEnvIfUnset(): void {
  process.env.DATABASE_URL ??= "postgresql://unused/openapi-export";
  process.env.JWT_SECRET ??= "unused-openapi-export-placeholder";
  process.env.TIP_REGISTRY_PROGRAM_ID ??= "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
  process.env.REDIS_URL ??= "redis://unused/openapi-export";
}

async function main(): Promise<void> {
  setPlaceholderEnvIfUnset();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideModule(DbModule)
    .useModule(StubDbModule)
    .overrideModule(RedisModule)
    .useModule(StubRedisModule)
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
  await app.init();

  const document = SwaggerModule.createDocument(app, createApiDocumentConfig(), apiDocumentOptions);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");

  await app.close();
  console.log(`OpenAPI document written to ${OUTPUT_PATH}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
