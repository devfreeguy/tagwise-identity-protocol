import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { PrismaClient } from "@tip/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TagOwnershipGuard } from "../src/auth/guards/tag-ownership.guard.js";
import { makeExecutionContext } from "./helpers/execution-context.js";

function makeFakeDb() {
  return {
    identity: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient;
}

const OWNER = "OwnerPubkey11111111111111111111111111111";
const OTHER = "OtherPubkey11111111111111111111111111111";

describe("TagOwnershipGuard", () => {
  let db: ReturnType<typeof makeFakeDb>;
  let guard: TagOwnershipGuard;

  beforeEach(() => {
    db = makeFakeDb();
    guard = new TagOwnershipGuard(db);
  });

  it("passes when the authenticated pubkey owns the tag", async () => {
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      owner: OWNER,
      status: "active",
    });
    const request = { authPubkey: OWNER, params: { tag: "daniel" } };

    await expect(guard.canActivate(makeExecutionContext(request))).resolves.toBe(true);
  });

  it("rejects with 403 when the authenticated pubkey does not own the tag", async () => {
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      owner: OWNER,
      status: "active",
    });
    const request = { authPubkey: OTHER, params: { tag: "daniel" } };

    await expect(guard.canActivate(makeExecutionContext(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects with 404 when the tag does not exist", async () => {
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const request = { authPubkey: OWNER, params: { tag: "ghost" } };

    await expect(guard.canActivate(makeExecutionContext(request))).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects with 404 when the tag is blocked", async () => {
    (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      owner: OWNER,
      status: "blocked",
    });
    const request = { authPubkey: OWNER, params: { tag: "daniel" } };

    await expect(guard.canActivate(makeExecutionContext(request))).rejects.toBeInstanceOf(NotFoundException);
  });
});
