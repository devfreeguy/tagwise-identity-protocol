import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Identity, PrismaClient } from "@tip/db";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigService } from "../src/config/config.service.js";
import { NoopCacheReader } from "../src/tags/cache-reader.js";
import { NotFoundChainFallback } from "../src/tags/chain-fallback.js";
import type { UpdateIdentityRequestDto } from "../src/tags/dto/update-identity-request.dto.js";
import { TagsService } from "../src/tags/tags.service.js";

const OWNER = "OwnerPubkey11111111111111111111111111111";
const OTHER = "OtherPubkey11111111111111111111111111111";

const NO_FIELDS_PROVIDED = { displayName: false, avatar: false, bio: false, preferredToken: false };

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
      update: vi.fn(),
    },
  } as unknown as PrismaClient;
}

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.PAYMENT_LINK_BASE_URL = "https://tagwise.me";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.TIP_REGISTRY_PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
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
    it("reports available for an unknown, clean, non-reserved canonical tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await service.availability("freshtag");

      expect(result).toEqual({ tag: "@freshtag", available: true, reason: "available" });
    });

    it("reports invalid for non-canonical input, without a 400", async () => {
      const result = await service.availability("ab");

      expect(result).toEqual({ tag: "@ab", available: false, reason: "invalid" });
      expect(db.identity.findUnique).not.toHaveBeenCalled();
    });

    it("reports reserved for a reserved tag", async () => {
      const result = await service.availability("admin");

      expect(result).toEqual({ tag: "@admin", available: false, reason: "reserved" });
      expect(db.identity.findUnique).not.toHaveBeenCalled();
    });

    it("reports inappropriate for a profane tag", async () => {
      const result = await service.availability("fuck");

      expect(result).toEqual({ tag: "@fuck", available: false, reason: "inappropriate" });
      expect(db.identity.findUnique).not.toHaveBeenCalled();
    });

    it("reports already_registered for an existing active tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "active" });

      const result = await service.availability("daniel");

      expect(result).toEqual({ tag: "@daniel", available: false, reason: "already_registered" });
    });

    it("reports already_registered for a blocked tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "blocked" });

      const result = await service.availability("daniel");

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

  describe("updateIdentity", () => {
    it("rejects with 403 when the caller does not own the tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));

      await expect(
        service.updateIdentity({
          tag: "daniel" as never,
          ownerPubkey: OTHER,
          dto: { displayName: "New Name" },
          provided: { ...NO_FIELDS_PROVIDED, displayName: true },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.identity.update).not.toHaveBeenCalled();
    });

    it("rejects with 404 for a missing tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.updateIdentity({
          tag: "ghost" as never,
          ownerPubkey: OWNER,
          dto: { displayName: "New Name" },
          provided: { ...NO_FIELDS_PROVIDED, displayName: true },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects with 404 for a blocked tag", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ owner: OWNER, status: "blocked" }),
      );

      await expect(
        service.updateIdentity({
          tag: "daniel" as never,
          ownerPubkey: OWNER,
          dto: { displayName: "New Name" },
          provided: { ...NO_FIELDS_PROVIDED, displayName: true },
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("partial update: only displayName provided leaves bio and the other columns untouched", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));
      (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ owner: OWNER, displayName: "New Name" }),
      );

      await service.updateIdentity({
        tag: "daniel" as never,
        ownerPubkey: OWNER,
        dto: { displayName: "New Name" },
        provided: { ...NO_FIELDS_PROVIDED, displayName: true },
      });

      expect(db.identity.update).toHaveBeenCalledWith({
        where: { tag: "daniel" },
        data: { displayName: "New Name" },
      });
    });

    it("an explicit null clears a field per the documented null-vs-omitted semantics", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ owner: OWNER, bio: "old bio" }),
      );
      (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER, bio: null }));

      await service.updateIdentity({
        tag: "daniel" as never,
        ownerPubkey: OWNER,
        dto: { bio: null },
        provided: { ...NO_FIELDS_PROVIDED, bio: true },
      });

      expect(db.identity.update).toHaveBeenCalledWith({
        where: { tag: "daniel" },
        data: { bio: null },
      });
    });

    it("writes only the four allowed columns, never tag/owner/wallet/bump/lastAppliedSlot/status, even when every field is provided", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));
      (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));

      const dto: UpdateIdentityRequestDto = {
        displayName: "New Name",
        avatar: "https://example.com/a.png",
        bio: "new bio",
        preferredToken: "USDC",
      };

      await service.updateIdentity({
        tag: "daniel" as never,
        ownerPubkey: OWNER,
        dto,
        provided: { displayName: true, avatar: true, bio: true, preferredToken: true },
      });

      const call = (db.identity.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(Object.keys(call.data).sort()).toEqual(["avatar", "bio", "displayName", "preferredToken"]);
      expect(call.data).toEqual(dto);
    });

    it("rejects a profane displayName with the profanity reason and does not write", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));

      await expect(
        service.updateIdentity({
          tag: "daniel" as never,
          ownerPubkey: OWNER,
          dto: { displayName: "fuck" },
          provided: { ...NO_FIELDS_PROVIDED, displayName: true },
        }),
      ).rejects.toMatchObject({ response: { reason: "profanity" } });
      expect(db.identity.update).not.toHaveBeenCalled();
    });

    it("rejects a profane bio with the profanity reason", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));

      await expect(
        service.updateIdentity({
          tag: "daniel" as never,
          ownerPubkey: OWNER,
          dto: { bio: "s1ut" },
          provided: { ...NO_FIELDS_PROVIDED, bio: true },
        }),
      ).rejects.toMatchObject({ response: { reason: "profanity" } });
    });

    it("allows an allowlisted word (analyze) in displayName", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));
      (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ owner: OWNER, displayName: "analyze" }),
      );

      await expect(
        service.updateIdentity({
          tag: "daniel" as never,
          ownerPubkey: OWNER,
          dto: { displayName: "analyze" },
          provided: { ...NO_FIELDS_PROVIDED, displayName: true },
        }),
      ).resolves.toBeDefined();
    });

    it("allows an allowlisted word (classic) in bio", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));
      (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ owner: OWNER, bio: "classic" }),
      );

      await expect(
        service.updateIdentity({
          tag: "daniel" as never,
          ownerPubkey: OWNER,
          dto: { bio: "classic" },
          provided: { ...NO_FIELDS_PROVIDED, bio: true },
        }),
      ).resolves.toBeDefined();
    });

    it("returns the same public shape as GET identity, never id or lastAppliedSlot", async () => {
      (db.identity.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeIdentity({ owner: OWNER }));
      (db.identity.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        makeIdentity({ owner: OWNER, displayName: "New Name" }),
      );

      const result = await service.updateIdentity({
        tag: "daniel" as never,
        ownerPubkey: OWNER,
        dto: { displayName: "New Name" },
        provided: { ...NO_FIELDS_PROVIDED, displayName: true },
      });

      expect(result).toEqual({
        tag: "@daniel",
        owner: OWNER,
        wallet: "WalletPubkey1111111111111111111111111111",
        displayName: "New Name",
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
  });
});
