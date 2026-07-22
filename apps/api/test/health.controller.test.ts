import type { PrismaClient } from "@tip/db";
import { describe, expect, it, vi } from "vitest";

import { HealthController } from "../src/health/health.controller.js";

function makeFakeDb(behavior: "ok" | "fail") {
  return {
    $queryRaw: vi.fn().mockImplementation(() => (behavior === "ok" ? Promise.resolve([{ x: 1 }]) : Promise.reject(new Error("db down")))),
  } as unknown as PrismaClient;
}

function makeFakeRedis(behavior: "ok" | "fail") {
  return {
    ping: vi.fn().mockImplementation(() => (behavior === "ok" ? Promise.resolve("PONG") : Promise.reject(new Error("redis down")))),
  } as never;
}

describe("HealthController", () => {
  it("reports both reachable when both are healthy", async () => {
    const controller = new HealthController(makeFakeDb("ok"), makeFakeRedis("ok"));

    const result = await controller.check();

    expect(result).toEqual({ status: "ok", db: "reachable", redis: "reachable" });
  });

  it("reports redis unreachable without failing the whole endpoint or hiding db's status", async () => {
    const controller = new HealthController(makeFakeDb("ok"), makeFakeRedis("fail"));

    const result = await controller.check();

    expect(result).toEqual({ status: "ok", db: "reachable", redis: "unreachable" });
  });

  it("reports db unreachable without failing the whole endpoint or hiding redis's status", async () => {
    const controller = new HealthController(makeFakeDb("fail"), makeFakeRedis("ok"));

    const result = await controller.check();

    expect(result).toEqual({ status: "ok", db: "unreachable", redis: "reachable" });
  });

  it("reports both unreachable, still with status ok at the top level", async () => {
    const controller = new HealthController(makeFakeDb("fail"), makeFakeRedis("fail"));

    const result = await controller.check();

    expect(result).toEqual({ status: "ok", db: "unreachable", redis: "unreachable" });
  });
});
