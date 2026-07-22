import type { PrismaClient } from "@tip/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { isBlockedNameMock } = vi.hoisted(() => ({
  isBlockedNameMock: vi.fn().mockReturnValue({ blocked: false }),
}));

vi.mock("../src/tags/profanity.js", () => ({
  isBlockedName: isBlockedNameMock,
}));

const { checkNamingGate } = await import("../src/tags/naming-gate.js");

function makeFakeDb() {
  return {
    identity: { findUnique: vi.fn().mockResolvedValue(null) },
  } as unknown as PrismaClient;
}

describe("checkNamingGate", () => {
  beforeEach(() => {
    isBlockedNameMock.mockClear();
    isBlockedNameMock.mockReturnValue({ blocked: false });
  });

  it("checks reserved before profanity: a reserved tag never reaches the profanity check", async () => {
    const db = makeFakeDb();

    const result = await checkNamingGate(db, "admin" as never);

    expect(result).toEqual({ available: false, reason: "reserved" });
    expect(isBlockedNameMock).not.toHaveBeenCalled();
    expect(db.identity.findUnique).not.toHaveBeenCalled();
  });

  it("returns inappropriate when the profanity check blocks a non-reserved tag", async () => {
    isBlockedNameMock.mockReturnValue({ blocked: true, reason: "profanity" });
    const db = makeFakeDb();

    const result = await checkNamingGate(db, "notreserved" as never);

    expect(result).toEqual({ available: false, reason: "inappropriate" });
    expect(isBlockedNameMock).toHaveBeenCalledWith("notreserved");
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
