import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { beforeEach, describe, expect, it } from "vitest";

import { JwtAuthGuard, type AuthenticatedRequest } from "../src/auth/guards/jwt-auth.guard.js";
import { ConfigService } from "../src/config/config.service.js";
import { makeExecutionContext } from "./helpers/execution-context.js";

function makeConfigService(): ConfigService {
  process.env.DATABASE_URL = "postgresql://unused/for-tests";
  process.env.JWT_SECRET = "test-secret-does-not-leave-this-process";
  return new ConfigService();
}

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let jwt: JwtService;
  let config: ConfigService;

  beforeEach(() => {
    jwt = new JwtService({});
    config = makeConfigService();
    guard = new JwtAuthGuard(jwt, config);
  });

  it("passes for a valid token and exposes the right pubkey on the request", async () => {
    const token = await jwt.signAsync(
      { sub: "SomePubkey11111111111111111111111111111111" },
      { secret: config.config.jwtSecret, expiresIn: "1h" },
    );
    const request: AuthenticatedRequest = { headers: { authorization: `Bearer ${token}` } };

    const result = await guard.canActivate(makeExecutionContext(request));

    expect(result).toBe(true);
    expect(request.authPubkey).toBe("SomePubkey11111111111111111111111111111111");
  });

  it("rejects a missing token with 401", async () => {
    const request: AuthenticatedRequest = { headers: {} };
    await expect(guard.canActivate(makeExecutionContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a malformed token with 401", async () => {
    const request: AuthenticatedRequest = { headers: { authorization: "Bearer not-a-real-jwt" } };
    await expect(guard.canActivate(makeExecutionContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects an expired token with 401", async () => {
    const token = await jwt.signAsync(
      { sub: "SomePubkey11111111111111111111111111111111" },
      { secret: config.config.jwtSecret, expiresIn: "-10s" },
    );
    const request: AuthenticatedRequest = { headers: { authorization: `Bearer ${token}` } };
    await expect(guard.canActivate(makeExecutionContext(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
