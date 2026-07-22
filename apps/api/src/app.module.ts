import { Module } from "@nestjs/common";

import { AuthModule } from "./auth/auth.module.js";
import { ConfigModule } from "./config/config.module.js";
import { DbModule } from "./db/db.module.js";
import { HealthModule } from "./health/health.module.js";
import { RegisterModule } from "./register/register.module.js";
import { RpcModule } from "./solana/rpc.module.js";
import { TagsModule } from "./tags/tags.module.js";

@Module({
  imports: [ConfigModule, DbModule, RpcModule, HealthModule, TagsModule, AuthModule, RegisterModule],
})
export class AppModule {}
