import { Global, Module, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { createDbClient, type PrismaClient } from "@tip/db";

import { ConfigService } from "../config/config.service.js";

export const DB_CLIENT = Symbol("DB_CLIENT");

/**
 * Wraps the shared @tip/db PrismaClient so Nest DI owns its lifecycle:
 * connected once on bootstrap, closed once on shutdown (SIGINT/SIGTERM, wired
 * in main.ts via app.enableShutdownHooks()).
 */
class DbClientHolder implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor(config: ConfigService) {
    this.client = createDbClient(config.config.databaseUrl);
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DbClientHolder,
      useFactory: (config: ConfigService) => new DbClientHolder(config),
      inject: [ConfigService],
    },
    {
      provide: DB_CLIENT,
      useFactory: (holder: DbClientHolder) => holder.client,
      inject: [DbClientHolder],
    },
  ],
  exports: [DB_CLIENT],
})
export class DbModule {}
