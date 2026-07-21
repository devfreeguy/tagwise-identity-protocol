import { NotFoundException } from "@nestjs/common";
import type { Identity, PrismaClient } from "@tip/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { NoopCacheReader } from "../src/tags/cache-reader.js";
import { NotFoundChainFallback } from "../src/tags/chain-fallback.js";
import { TagsService } from "../src/tags/tags.service.js";

function makeIdentity(overrides: Partial<Identity> = {}): Identity {
  return {
    id: "019f0000-0000-7000-8000-000000000000",
    tag: "daniel",
    owner: "OwnerPubkey11111111111111111111111111111",
    wallet: "WalletPubkey1111111111111111111111111111",
    bump: 254,
    displayName: "Daniel",
    avatar: null,
    bio: null,
    preferredToken: null,
    verified: false,
    merchant: false,
    status: "active",
    lastAppliedSlot: 100n,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeFakeDb() {
  return {
    identity: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as PrismaClient;
}

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.PAYMENT_LINK_BASE_URL = "https://tagwise.me";
  return new ConfigService();
}

describe("TagsService", () => {
  let db: ReturnType<typeof makeFakeDb>;
  let service: TagsService;

  beforeEach(() => {
    db = makeFakeDb();
    service = new TagsService(db, new NoopCacheReader(), new NotFoundChainFallback(), makeConfigService());
  });

  describe("resolve", () => {
    it("returns the mapped shape for an active row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity());

      const result = await service.resolve("daniel" as never);

      expect(result).toEqual({
        tag: "@daniel",
        wallet: "WalletPubkey1111111111111111111111111111",
        displayName: "Daniel",
        avatar: null,
        verified: false,
        merchant: false,
        preferredToken: null,
        paymentLink: "https://tagwise.me/@daniel",
        links: {
          profile: "https://tagwise.me/@daniel",
          qr: "https://tagwise.me/@daniel/qr",
        },
      });
    });

    it("throws NotFoundException for a missing row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.resolve("ghost" as never)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws NotFoundException for a blocked row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ status: "blocked" }),
      );

      await expect(service.resolve("daniel" as never)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("identity", () => {
    it("returns the public identity object for an active row, without internal fields", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity());

      const result = await service.identity("daniel" as never);

      expect(result).toEqual({
        tag: "@daniel",
        owner: "OwnerPubkey11111111111111111111111111111",
        wallet: "WalletPubkey1111111111111111111111111111",
        displayName: "Daniel",
        avatar: null,
        bio: null,
        preferredToken: null,
        verified: false,
        merchant: false,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      });
      expect(result).not.toHaveProperty("id");
      expect(result).not.toHaveProperty("lastAppliedSlot");
    });

    it("throws NotFoundException for a missing row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.identity("ghost" as never)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws NotFoundException for a blocked row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ status: "blocked" }),
      );

      await expect(service.identity("daniel" as never)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("qr", () => {
    it("returns the QR payload for an active row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity());

      const result = await service.qr("daniel" as never);

      expect(result).toEqual({
        tag: "@daniel",
        wallet: "WalletPubkey1111111111111111111111111111",
        paymentLink: "https://tagwise.me/@daniel",
      });
    });

    it("throws NotFoundException for a blocked row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ status: "blocked" }),
      );

      await expect(service.qr("daniel" as never)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("paymentLink", () => {
    it("returns the payment link metadata for an active row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity());

      const result = await service.paymentLink("daniel" as never);

      expect(result).toEqual({
        tag: "@daniel",
        wallet: "WalletPubkey1111111111111111111111111111",
        paymentLink: "https://tagwise.me/@daniel",
      });
    });

    it("throws NotFoundException for a blocked row", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ status: "blocked" }),
      );

      await expect(service.paymentLink("daniel" as never)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("availability", () => {
    it("reports available for an unknown canonical tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.availability("freshtag" as never);

      expect(result).toEqual({ tag: "@freshtag", available: true, reason: "canonical_and_unused" });
    });

    it("reports taken for an existing active tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "active" });

      const result = await service.availability("daniel" as never);

      expect(result).toEqual({ tag: "@daniel", available: false, reason: "already_registered" });
    });

    it("reports taken for a blocked tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "blocked" });

      const result = await service.availability("daniel" as never);

      expect(result).toEqual({ tag: "@daniel", available: false, reason: "already_registered" });
    });
  });

  describe("search", () => {
    it("returns an empty list for an empty query, not an error", async () => {
      const result = await service.search("");
      expect(result).toEqual([]);
      expect(db.identity.findMany).not.toHaveBeenCalled();
    });

    it("ranks exact and prefix tag matches ahead of displayName-only matches", async () => {
      const rows: Identity[] = [
        makeIdentity({ tag: "randomguy", displayName: "dan the man" }),
        makeIdentity({ tag: "danielle", displayName: "Danielle" }),
        makeIdentity({ tag: "dan", displayName: "someone" }),
        makeIdentity({ tag: "daniel", displayName: "Daniel" }),
      ];
      (db.identity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(rows);

      const result = await service.search("dan");

      expect(result.map((r) => r.tag)).toEqual(["@dan", "@daniel", "@danielle", "@randomguy"]);
    });

    it("caps results at 10", async () => {
      const rows: Identity[] = Array.from({ length: 15 }, (_, i) =>
        makeIdentity({ tag: `dantag${i}`, displayName: `Dan ${i}` }),
      );
      (db.identity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(rows);

      const result = await service.search("dan");

      expect(result.length).toBe(10);
    });
  });
});
