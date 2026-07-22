import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { beforeEach, describe, expect, it } from "vitest";

import { AuthService } from "../src/auth/auth.service.js";
import { buildSignInMessage, parseSignInMessage } from "../src/auth/message.js";
import { InMemoryNonceStore } from "../src/auth/nonce-store.js";
import { ConfigService } from "../src/config/config.service.js";
import { generateTestKeypair, signMessage, type TestKeypair } from "./helpers/keypair.js";

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.AUTH_DOMAIN = "tagwise.test";
  process.env.AUTH_TOKEN_TTL = "1h";
  process.env.AUTH_NONCE_TTL = "300";
  process.env.THROTTLE_TTL = "60";
  process.env.THROTTLE_LIMIT = "5";
  return new ConfigService();
}

describe("AuthService", () => {
  let authService: AuthService;
  let nonceStore: InMemoryNonceStore;
  let jwt: JwtService;
  let config: ConfigService;
  let keypair: TestKeypair;

  beforeEach(() => {
    nonceStore = new InMemoryNonceStore();
    jwt = new JwtService({});
    config = makeConfigService();
    authService = new AuthService(nonceStore, jwt, config);
    keypair = generateTestKeypair();
  });

  describe("challenge", () => {
    it("returns a message containing the nonce for a valid pubkey", async () => {
      const message = await authService.challenge(keypair.pubkeyBase58);
      const parsed = parseSignInMessage(message);

      expect(parsed).not.toBeNull();
      expect(parsed?.pubkey).toBe(keypair.pubkeyBase58);
      expect(message).toContain("Nonce: ");
      expect(parsed?.nonce.length).toBeGreaterThan(0);
    });

    it("rejects a malformed pubkey with 400", async () => {
      await expect(authService.challenge("not-a-real-pubkey")).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("verify", () => {
    it("returns a token for a correct signature over the issued message", async () => {
      const message = await authService.challenge(keypair.pubkeyBase58);
      const signature = signMessage(message, keypair.secretKey);

      const token = await authService.verify(keypair.pubkeyBase58, message, signature);

      expect(typeof token).toBe("string");
      const payload = await jwt.verifyAsync<{ sub: string }>(token, { secret: config.config.jwtSecret });
      expect(payload.sub).toBe(keypair.pubkeyBase58);
    });

    it("rejects a wrong signature (signed by a different keypair)", async () => {
      const message = await authService.challenge(keypair.pubkeyBase58);
      const attacker = generateTestKeypair();
      const wrongSignature = signMessage(message, attacker.secretKey);

      await expect(
        authService.verify(keypair.pubkeyBase58, message, wrongSignature),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a tampered message body (signature no longer matches the bytes)", async () => {
      const message = await authService.challenge(keypair.pubkeyBase58);
      const signature = signMessage(message, keypair.secretKey);
      const tamperedMessage = message.replace("Sign in to authenticate", "Sign in to steal your funds");

      await expect(
        authService.verify(keypair.pubkeyBase58, tamperedMessage, signature),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a nonce that was never issued", async () => {
      const fabricatedMessage = buildSignInMessage({
        domain: config.config.authDomain,
        pubkey: keypair.pubkeyBase58,
        nonce: "0000000000000000000000000000000000000000000000",
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 60_000).toISOString(),
      });
      const signature = signMessage(fabricatedMessage, keypair.secretKey);

      await expect(
        authService.verify(keypair.pubkeyBase58, fabricatedMessage, signature),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects an expired message (expirationTime in the past)", async () => {
      const nonce = "abcabcabcabcabcabcabcabcabcabcabcabcabcabcabcab";
      await nonceStore.put(keypair.pubkeyBase58, nonce, 300);

      const expiredMessage = buildSignInMessage({
        domain: config.config.authDomain,
        pubkey: keypair.pubkeyBase58,
        nonce,
        issuedAt: new Date(Date.now() - 120_000).toISOString(),
        expirationTime: new Date(Date.now() - 60_000).toISOString(),
      });
      const signature = signMessage(expiredMessage, keypair.secretKey);

      await expect(
        authService.verify(keypair.pubkeyBase58, expiredMessage, signature),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects replay: the second verify with the same nonce and signature fails", async () => {
      const message = await authService.challenge(keypair.pubkeyBase58);
      const signature = signMessage(message, keypair.secretKey);

      const firstToken = await authService.verify(keypair.pubkeyBase58, message, signature);
      expect(typeof firstToken).toBe("string");

      await expect(authService.verify(keypair.pubkeyBase58, message, signature)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects a nonce issued for pubkey A when presented with pubkey B", async () => {
      const messageForA = await authService.challenge(keypair.pubkeyBase58);
      const pubkeyB = generateTestKeypair();
      const signature = signMessage(messageForA, keypair.secretKey);

      await expect(
        authService.verify(pubkeyB.pubkeyBase58, messageForA, signature),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
