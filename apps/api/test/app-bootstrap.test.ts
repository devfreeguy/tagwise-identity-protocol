import { ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "../src/app.module.js";
import { GlobalExceptionFilter } from "../src/common/global-exception.filter.js";
import { generateTestKeypair } from "./helpers/keypair.js";

// Mocking @tip/db's createDbClient (rather than overriding the DB_CLIENT
// Nest provider) means the real DbClientHolder never attempts a real
// Postgres connection during onModuleInit: this keeps the whole suite
// network- and database-free, including the bootstrap smoke test, while
// still wiring every real module exactly as production does.
const { fakeDb } = vi.hoisted(() => ({
  fakeDb: {
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    identity: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@tip/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tip/db")>();
  return { ...actual, createDbClient: () => fakeDb };
});

const PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
const JWT_SECRET = "test-secret-does-not-leave-this-process";

function setTestEnv(): void {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.TIP_REGISTRY_PROGRAM_ID = PROGRAM_ID;
  process.env.PAYMENT_LINK_BASE_URL = "https://tagwise.me";
}

function signToken(pubkey: string): Promise<string> {
  return new JwtService().signAsync({ sub: pubkey }, { secret: JWT_SECRET, expiresIn: "1h" });
}

describe("Nest application bootstrap", () => {
  it("initializes the full app (all modules wired) without throwing", async () => {
    setTestEnv();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await expect(app.init()).resolves.toBeDefined();

    await app.close();
  });
});

describe("PATCH /v1/identity/:tag (HTTP integration)", () => {
  let app: NestFastifyApplication;
  let owner: string;
  let ownerToken: string;

  beforeAll(async () => {
    setTestEnv();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    owner = generateTestKeypair().pubkeyBase58;
    ownerToken = await signToken(owner);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    fakeDb.identity.findUnique.mockReset();
    fakeDb.identity.update.mockReset();
  });

  function inject(payload: unknown, headers: Record<string, string> = {}) {
    return app.getHttpAdapter().getInstance().inject({
      method: "PATCH",
      url: "/v1/identity/daniel",
      headers,
      payload,
    });
  }

  it("returns 401 without a bearer token", async () => {
    const response = await inject({ displayName: "New Name" });
    expect(response.statusCode).toBe(401);
  });

  it("returns 403 when the authenticated pubkey does not own the tag", async () => {
    fakeDb.identity.findUnique.mockResolvedValue({ owner, status: "active" });
    const other = generateTestKeypair().pubkeyBase58;
    const otherToken = await signToken(other);

    const response = await inject({ displayName: "New Name" }, { authorization: `Bearer ${otherToken}` });
    expect(response.statusCode).toBe(403);
  });

  it("returns 404 for a missing tag", async () => {
    fakeDb.identity.findUnique.mockResolvedValue(null);

    const response = await inject({ displayName: "New Name" }, { authorization: `Bearer ${ownerToken}` });
    expect(response.statusCode).toBe(404);
  });

  it("returns 404 for a blocked tag", async () => {
    fakeDb.identity.findUnique.mockResolvedValue({ owner, status: "blocked" });

    const response = await inject({ displayName: "New Name" }, { authorization: `Bearer ${ownerToken}` });
    expect(response.statusCode).toBe(404);
  });

  it("rejects an unknown property (wallet) with 400, even for the owner", async () => {
    fakeDb.identity.findUnique.mockResolvedValue({ owner, status: "active" });

    const response = await inject(
      { wallet: generateTestKeypair().pubkeyBase58 },
      { authorization: `Bearer ${ownerToken}` },
    );
    expect(response.statusCode).toBe(400);
  });

  it("partial update: only displayName in the body writes only displayName", async () => {
    fakeDb.identity.findUnique.mockResolvedValue({ owner, status: "active" });
    fakeDb.identity.update.mockResolvedValue({
      tag: "daniel",
      owner,
      wallet: "WalletPubkey1111111111111111111111111111",
      displayName: "New Name",
      avatar: null,
      bio: null,
      preferredToken: null,
      verified: false,
      merchant: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await inject({ displayName: "New Name" }, { authorization: `Bearer ${ownerToken}` });

    expect(response.statusCode).toBe(200);
    expect(fakeDb.identity.update).toHaveBeenCalledWith({
      where: { tag: "daniel" },
      data: { displayName: "New Name" },
    });

    const body = response.json();
    expect(body).toEqual({
      tag: "@daniel",
      owner,
      wallet: "WalletPubkey1111111111111111111111111111",
      displayName: "New Name",
      avatar: null,
      bio: null,
      preferredToken: null,
      verified: false,
      merchant: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(body).not.toHaveProperty("id");
    expect(body).not.toHaveProperty("lastAppliedSlot");
  });

  it("an explicit null clears bio", async () => {
    fakeDb.identity.findUnique.mockResolvedValue({ owner, status: "active" });
    fakeDb.identity.update.mockResolvedValue({
      tag: "daniel",
      owner,
      wallet: "WalletPubkey1111111111111111111111111111",
      displayName: null,
      avatar: null,
      bio: null,
      preferredToken: null,
      verified: false,
      merchant: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await inject({ bio: null }, { authorization: `Bearer ${ownerToken}` });

    expect(response.statusCode).toBe(200);
    expect(fakeDb.identity.update).toHaveBeenCalledWith({
      where: { tag: "daniel" },
      data: { bio: null },
    });
  });
});
