import { getBase58Decoder } from "@solana/kit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "../src/errors.js";
import { TipClient } from "../src/client.js";
import type { Signer } from "../src/types.js";

const PUBKEY = "OwnerPubkey11111111111111111111111111111";
const CHALLENGE_MESSAGE = "tagwise.me wants you to sign in with your Solana account:\n" + PUBKEY;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function fakeSignature(): Uint8Array {
  const bytes = new Uint8Array(64);
  bytes.fill(7);
  return bytes;
}

describe("TipClient auth (connect)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: TipClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    client = new TipClient({ baseUrl: "https://api.example.com", fetch: fetchMock as never });
  });

  it("connect() performs challenge, signs the exact message bytes, verifies, and stores the token", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: CHALLENGE_MESSAGE }))
      .mockResolvedValueOnce(jsonResponse({ token: "session.jwt.token" }));

    const signature = fakeSignature();
    const signMessage = vi.fn().mockResolvedValue(signature);
    // A minimal object with ONLY publicKey and signMessage: proves the SDK
    // needs nothing else, in particular no secret key, to authenticate.
    const signer: Signer = { publicKey: PUBKEY, signMessage };

    const authenticatedPubkey = await client.connect(signer);

    expect(authenticatedPubkey).toBe(PUBKEY);
    expect(client.token).toBe("session.jwt.token");
    expect(client.connectedPubkey).toBe(PUBKEY);

    // challenge call
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/v1/auth/challenge",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ pubkey: PUBKEY }) }),
    );

    // signMessage was called with the exact bytes of the message the server returned.
    expect(signMessage).toHaveBeenCalledTimes(1);
    const signedBytes = signMessage.mock.calls[0][0] as Uint8Array;
    expect(new TextDecoder().decode(signedBytes)).toBe(CHALLENGE_MESSAGE);

    // verify call carries the base58-encoded signature over that message.
    const expectedSignatureBase58 = getBase58Decoder().decode(signature);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/v1/auth/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ pubkey: PUBKEY, message: CHALLENGE_MESSAGE, signature: expectedSignatureBase58 }),
      }),
    );
  });

  it("a failing signature verification surfaces cleanly as UnauthorizedError", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: CHALLENGE_MESSAGE }))
      .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: "signature verification failed" }, 401));

    const signer: Signer = { publicKey: PUBKEY, signMessage: vi.fn().mockResolvedValue(fakeSignature()) };

    await expect(client.connect(signer)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(client.token).toBeUndefined();
  });

  it("setSession() restores a session without any network call", () => {
    client.setSession("persisted-token", PUBKEY);

    expect(client.token).toBe("persisted-token");
    expect(client.connectedPubkey).toBe(PUBKEY);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("disconnect() clears the in-memory session", () => {
    client.setSession("token", PUBKEY);
    client.disconnect();

    expect(client.token).toBeUndefined();
    expect(client.connectedPubkey).toBeUndefined();
  });
});
