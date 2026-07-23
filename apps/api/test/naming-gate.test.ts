import type { PrismaClient } from "@tip/db";
import { describe, expect, it, vi } from "vitest";

import { checkNamingGate } from "../src/tags/naming-gate.js";

function makeFakeDb() {
  return {
    identity: { findUnique: vi.fn().mockResolvedValue(null) },
  } as unknown as PrismaClient;
}

describe("checkNamingGate", () => {
  it("checks reserved before profanity: a reserved tag never reaches the mirror", async () => {
    const db = makeFakeDb();

    const result = await checkNamingGate(db, "admin" as never);

    expect(result).toEqual({ available: false, reason: "reserved" });
    expect(db.identity.findUnique).not.toHaveBeenCalled();
  });

  it("returns inappropriate when the shared moderation gate blocks a non-reserved tag", async () => {
    const db = makeFakeDb();

    const result = await checkNamingGate(db, "fuck" as never);

    expect(result).toEqual({ available: false, reason: "inappropriate" });
    expect(db.identity.findUnique).not.toHaveBeenCalled();
  });

  it("returns already_registered when the mirror has any row for the tag", async () => {
    const db = makeFakeDb();
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "active" });

    const result = await checkNamingGate(db, "daniel" as never);

    expect(result).toEqual({ available: false, reason: "already_registered" });
  });

  it("returns available for a clean, unused, non-reserved tag", async () => {
    const db = makeFakeDb();

    const result = await checkNamingGate(db, "freshtag123" as never);

    expect(result).toEqual({ available: true, reason: "available" });
  });
});
