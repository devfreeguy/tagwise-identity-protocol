import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  InsufficientBalanceError,
  RateLimitedError,
  TagNotFoundError,
  UnauthorizedError,
} from "../src/errors.js";
import { TipClient } from "../src/client.js";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("TipClient error mapping", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: TipClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    client = new TipClient({ baseUrl: "https://api.example.com", fetch: fetchMock as never });
  });

  it("maps 404 to TagNotFoundError", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ statusCode: 404, message: "tag @ghost not found" }, 404));

    await expect(client.resolve("ghosttagx")).rejects.toBeInstanceOf(TagNotFoundError);
  });

  it("maps 401 to UnauthorizedError with a reconnect message", async () => {
    // A fresh Response per call: this test issues the same request twice.
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ statusCode: 401, message: "invalid or expired token" }, 401)),
    );
    client.setSession("stale-token", "SomePubkey1111111111111111111111111111111");

    await expect(client.updateProfile("daniel", { displayName: "New" })).rejects.toBeInstanceOf(UnauthorizedError);
    try {
      await client.updateProfile("daniel", { displayName: "New" });
    } catch (error) {
      expect((error as UnauthorizedError).message).toContain("connect()");
    }
  });

  it("maps 429 to RateLimitedError", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ statusCode: 429, message: "ThrottlerException: Too Many Requests" }, 429));

    await expect(client.resolve("daniel")).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("maps 402 to InsufficientBalanceError with all three amounts", async () => {
    // A fresh Response per call: a Response body can only be read once, and
    // this test issues the same request twice (once for the instanceof
    // check, once to inspect the parsed fields).
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          {
            statusCode: 402,
            message: "insufficient balance to cover rent and fees for this registration",
            requiredLamports: "1500000",
            currentLamports: "100",
            shortfallLamports: "1499900",
          },
          402,
        ),
      ),
    );
    client.setSession("token", "OwnerPubkey11111111111111111111111111111");

    await expect(client.register({ tag: "freshtag" })).rejects.toBeInstanceOf(InsufficientBalanceError);

    try {
      await client.register({ tag: "freshtag" });
    } catch (error) {
      const insufficientBalance = error as InsufficientBalanceError;
      expect(insufficientBalance.requiredLamports).toBe(1_500_000n);
      expect(insufficientBalance.currentLamports).toBe(100n);
      expect(insufficientBalance.shortfallLamports).toBe(1_499_900n);
    }
  });
});
