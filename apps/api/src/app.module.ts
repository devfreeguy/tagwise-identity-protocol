import { Module } from "@nestjs/common";

import { ConfigModule } from "./config/config.module.js";
import { DbModule } from "./db/db.module.js";
import { HealthModule } from "./health/health.module.js";
import { TagsModule } from "./tags/tags.module.js";

@Module({
  imports: [ConfigModule, DbModule, HealthModule, TagsModule],
})
export class AppModule {}
