import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import RedisMock from "ioredis-mock";
import { beforeEach, describe, expect, it } from "vitest";

import { AuthService } from "../src/auth/auth.service.js";
import { buildSignInMessage, parseSignInMessage } from "../src/auth/message.js";
import { RedisNonceStore } from "../src/auth/redis-nonce-store.js";
import { ConfigService } from "../src/config/config.service.js";
import { generateTestKeypair, signMessage, type TestKeypair } from "./helpers/keypair.js";

/**
 * Same scenarios as auth.service.test.ts, run against RedisNonceStore
 * (backed by ioredis-mock) instead of InMemoryNonceStore, proving the
 * storage swap is behavior-preserving: every assertion here matches the
 * in-memory suite one-for-one.
 */
function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  process.env.AUTH_DOMAIN = "tagwise.test";
  process.env.AUTH_TOKEN_TTL = "1h";
  process.env.AUTH_NONCE_TTL = "300";
  process.env.THROTTLE_TTL = "60";
  process.env.THROTTLE_LIMIT = "5";
  process.env.TIP_REGISTRY_PROGRAM_ID = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
  process.env.REDIS_URL = "redis://unused/for-tests";
  return new ConfigService();
}

describe("AuthService (Redis-backed NonceStore)", () => {
  let authService: AuthService;
  let nonceStore: RedisNonceStore;
  let jwt: JwtService;
  let config: ConfigService;
  let keypair: TestKeypair;

  beforeEach(async () => {
    config = makeConfigService();
    const redis = new RedisMock();
    // ioredis-mock instances share one global in-memory store by default;
    // without this, state can leak in from another test.
    await redis.flushall();
    nonceStore = new RedisNonceStore(redis as never, config);
    jwt = new JwtService({});
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

    it("two challenges for the same pubkey are both independently redeemable", async () => {
      const messageA = await authService.challenge(keypair.pubkeyBase58);
      const messageB = await authService.challenge(keypair.pubkeyBase58);

      const tokenA = await authService.verify(keypair.pubkeyBase58, messageA, signMessage(messageA, keypair.secretKey));
      const tokenB = await authService.verify(keypair.pubkeyBase58, messageB, signMessage(messageB, keypair.secretKey));

      expect(typeof tokenA).toBe("string");
      expect(typeof tokenB).toBe("string");
    });
  });
});
