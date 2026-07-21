import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { PrismaClient } from "@tip/db";

import { DB_CLIENT } from "../db/db.module.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(@Inject(DB_CLIENT) private readonly db: PrismaClient) {}

  @Get()
  @ApiOperation({ summary: "Liveness and DB-reachability check" })
  async check(): Promise<{ status: "ok"; db: "reachable" | "unreachable" }> {
    let db: "reachable" | "unreachable" = "unreachable";
    try {
      await this.db.$queryRaw`SELECT 1`;
      db = "reachable";
    } catch {
      db = "unreachable";
    }
    return { status: "ok", db };
  }
}
