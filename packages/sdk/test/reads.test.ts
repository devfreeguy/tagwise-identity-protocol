import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_BASE_URL, TipClient } from "../src/client.js";
import { TagInvalidError } from "../src/errors.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("TipClient reads", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: TipClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    client = new TipClient({ baseUrl: "https://api.example.com", fetch: fetchMock as never });
  });

  it("resolve() maps to GET /v1/resolve/:tag and parses the response", async () => {
    const body = {
      tag: "@daniel",
      wallet: "Wallet1111111111111111111111111111111111",
      displayName: "Daniel",
      avatar: null,
      verified: false,
      merchant: false,
      preferredToken: null,
      paymentLink: "https://tagwise.me/@daniel",
      links: { profile: "https://tagwise.me/@daniel", qr: "https://tagwise.me/@daniel/qr" },
    };
    fetchMock.mockResolvedValue(jsonResponse(body));

    const result = await client.resolve("daniel");

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/v1/resolve/daniel", expect.objectContaining({ method: "GET" }));
  });

  it("identity() maps to GET /v1/identity/:tag", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ tag: "@daniel" }));
    await client.identity("daniel");
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/v1/identity/daniel", expect.objectContaining({ method: "GET" }));
  });

  it("qr() maps to GET /v1/qr/:tag", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ tag: "@daniel" }));
    await client.qr("daniel");
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/v1/qr/daniel", expect.objectContaining({ method: "GET" }));
  });

  it("paymentLink() maps to GET /v1/payment-link/:tag", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ tag: "@daniel" }));
    await client.paymentLink("daniel");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/payment-link/daniel",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("search() maps to GET /v1/search?q=", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await client.search("dan");
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/v1/search?q=dan", expect.objectContaining({ method: "GET" }));
  });

  it("availability() maps to GET /v1/availability/:tag for a valid tag", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ tag: "@daniel", available: true, reason: "available" }));
    const result = await client.availability("daniel");
    expect(result.available).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/availability/daniel",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("availability() answers invalid locally for a malformed tag, with no network call", async () => {
    const result = await client.availability("a");
    expect(result).toEqual({ tag: "@a", available: false, reason: "invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  for (const method of ["resolve", "identity", "qr", "paymentLink"] as const) {
    it(`${method}() fails client-side with the correct reason for a malformed tag, with no network call`, async () => {
      await expect(client[method]("a")).rejects.toBeInstanceOf(TagInvalidError);
      expect(fetchMock).not.toHaveBeenCalled();

      try {
        await client[method]("a");
      } catch (error) {
        expect((error as TagInvalidError).reason).toBe("TOO_SHORT");
      }
    });
  }

  it("rejects an empty tag with EMPTY, no network call", async () => {
    await expect(client.resolve("")).rejects.toBeInstanceOf(TagInvalidError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a too-long tag with TOO_LONG, no network call", async () => {
    await expect(client.resolve("a".repeat(21))).rejects.toBeInstanceOf(TagInvalidError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid-character tag with INVALID_CHAR, no network call", async () => {
    await expect(client.resolve("bad tag")).rejects.toBeInstanceOf(TagInvalidError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("TipClient default baseUrl", () => {
  it("new TipClient() with no arguments defaults baseUrl to the public API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ tag: "@daniel" }));
    const client = new TipClient({ fetch: fetchMock as never });

    await client.resolve("daniel");

    expect(fetchMock).toHaveBeenCalledWith(`${DEFAULT_BASE_URL}/v1/resolve/daniel`, expect.objectContaining({ method: "GET" }));
  });

  it("an explicit baseUrl overrides the default", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ tag: "@daniel" }));
    const client = new TipClient({ baseUrl: "https://staging.example.com", fetch: fetchMock as never });

    await client.resolve("daniel");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://staging.example.com/v1/resolve/daniel",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
