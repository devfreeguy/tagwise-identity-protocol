import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { PrismaClient } from "@tip/db";

import { DB_CLIENT } from "../db/db.module.js";
import { REDIS_CLIENT, type ApiRedis } from "../redis/redis.js";

type Reachability = "reachable" | "unreachable";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PrismaClient,
    @Inject(REDIS_CLIENT) private readonly redis: ApiRedis,
  ) {}

  @Get()
  @ApiOperation({ summary: "Liveness, DB-reachability, and Redis-reachability check" })
  async check(): Promise<{ status: "ok"; db: Reachability; redis: Reachability }> {
    // Each dependency is checked independently so one being down never hides
    // or fails the check for the other; the endpoint itself always
    // responds, reporting each dependency's status distinctly.
    const [db, redis] = await Promise.all([this.checkDb(), this.checkRedis()]);
    return { status: "ok", db, redis };
  }

  private async checkDb(): Promise<Reachability> {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return "reachable";
    } catch {
      return "unreachable";
    }
  }

  private async checkRedis(): Promise<Reachability> {
    try {
      await this.redis.ping();
      return "reachable";
    } catch {
      return "unreachable";
    }
  }
}
