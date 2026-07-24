import { beforeEach, describe, expect, it, vi } from "vitest";

import { NoSessionError } from "../src/errors.js";
import { TipClient } from "../src/client.js";

const OWNER = "OwnerPubkey11111111111111111111111111111";
const TOKEN = "session.jwt.token";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("TipClient writes", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: TipClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    client = new TipClient({ baseUrl: "https://api.example.com", fetch: fetchMock as never });
  });

  it("register() returns the unsigned transaction exactly as the API returned it, and does not sign it", async () => {
    const apiBody = {
      transaction: "base64-unsigned-transaction-bytes",
      pda: "PdaAddress111111111111111111111111111111",
      lastValidBlockHeight: "123456789",
    };
    fetchMock.mockResolvedValue(jsonResponse(apiBody));
    client.setSession(TOKEN, OWNER);

    const result = await client.register({ tag: "freshtag" });

    expect(result).toEqual(apiBody);
    expect(result.transaction).toBe(apiBody.transaction);
  });

  it("register() includes the bearer token", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ transaction: "tx", pda: "pda", lastValidBlockHeight: "1" }),
    );
    client.setSession(TOKEN, OWNER);

    await client.register({ tag: "freshtag" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("register() with feePayer includes it in the request body", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ transaction: "tx", pda: "pda", lastValidBlockHeight: "1" }),
    );
    client.setSession(TOKEN, OWNER);

    await client.register({ tag: "freshtag", feePayer: "SponsorPubkey1111111111111111111111111111" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ tag: "freshtag", feePayer: "SponsorPubkey1111111111111111111111111111" }));
  });

  it("register() without feePayer omits it from the request body", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ transaction: "tx", pda: "pda", lastValidBlockHeight: "1" }),
    );
    client.setSession(TOKEN, OWNER);

    await client.register({ tag: "freshtag" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ tag: "freshtag" }));
  });

  it("updateWallet() posts to /v1/identity/:tag/wallet with the bearer token", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ transaction: "tx", pda: "pda", lastValidBlockHeight: "1" }));
    client.setSession(TOKEN, OWNER);

    await client.updateWallet("daniel", "NewWallet1111111111111111111111111111111");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/identity/daniel/wallet",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ wallet: "NewWallet1111111111111111111111111111111" }),
        headers: expect.objectContaining({ authorization: `Bearer ${TOKEN}` }),
      }),
    );
  });

  it("updateProfile() patches /v1/identity/:tag and returns the updated identity", async () => {
    const updated = {
      tag: "@daniel",
      owner: OWNER,
      wallet: "Wallet1111111111111111111111111111111111",
      displayName: "New Name",
      avatar: null,
      bio: null,
      preferredToken: null,
      verified: false,
      merchant: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    fetchMock.mockResolvedValue(jsonResponse(updated));
    client.setSession(TOKEN, OWNER);

    const result = await client.updateProfile("daniel", { displayName: "New Name" });

    expect(result).toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/identity/daniel",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ displayName: "New Name" }),
        headers: expect.objectContaining({ authorization: `Bearer ${TOKEN}` }),
      }),
    );
  });

  it("register() without a connected session throws NoSessionError before any network call", async () => {
    await expect(client.register({ tag: "freshtag" })).rejects.toBeInstanceOf(NoSessionError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updateWallet() without a connected session throws NoSessionError before any network call", async () => {
    await expect(client.updateWallet("daniel", "Wallet1111111111111111111111111111111111")).rejects.toBeInstanceOf(
      NoSessionError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updateProfile() without a connected session throws NoSessionError before any network call", async () => {
    await expect(client.updateProfile("daniel", { displayName: "New" })).rejects.toBeInstanceOf(NoSessionError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
