import { Injectable } from "@nestjs/common";

export type AppConfig = Readonly<{
  port: number;
  databaseUrl: string;
  paymentLinkBaseUrl: string;
  jwtSecret: string;
  authDomain: string;
  authTokenTtl: string;
  authNonceTtlSeconds: number;
  throttleTtlSeconds: number;
  throttleLimit: number;
  tipRegistryProgramId: string;
  rpcHttpUrl: string;
  registerThrottleTtlSeconds: number;
  registerThrottleLimit: number;
  identityUpdateThrottleTtlSeconds: number;
  identityUpdateThrottleLimit: number;
  redisUrl: string;
  redisKeyPrefix: string;
}>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`missing required environment variable ${name}`);
  }
  return value;
}

/**
 * Reads configuration directly from process.env. Env loading itself happens
 * once in main.ts via `import "dotenv/config"`, explicitly, matching the
 * rest of the workspace. This service does no auto-loading of its own.
 */
@Injectable()
export class ConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = {
      port: Number(process.env.PORT ?? "3000"),
      databaseUrl: requireEnv("DATABASE_URL"),
      paymentLinkBaseUrl: process.env.PAYMENT_LINK_BASE_URL ?? "https://tagwise.me",
      // No default: a weak or shared JWT secret would let anyone forge
      // sessions, so this fails fast at startup rather than silently running
      // insecurely.
      jwtSecret: requireEnv("JWT_SECRET"),
      authDomain: process.env.AUTH_DOMAIN ?? "tagwise.me",
      authTokenTtl: process.env.AUTH_TOKEN_TTL ?? "1h",
      authNonceTtlSeconds: Number(process.env.AUTH_NONCE_TTL ?? "300"),
      throttleTtlSeconds: Number(process.env.THROTTLE_TTL ?? "60"),
      throttleLimit: Number(process.env.THROTTLE_LIMIT ?? "5"),
      tipRegistryProgramId: requireEnv("TIP_REGISTRY_PROGRAM_ID"),
      rpcHttpUrl: process.env.RPC_HTTP_URL ?? "https://api.devnet.solana.com",
      registerThrottleTtlSeconds: Number(process.env.REGISTER_THROTTLE_TTL ?? "60"),
      registerThrottleLimit: Number(process.env.REGISTER_THROTTLE_LIMIT ?? "3"),
      identityUpdateThrottleTtlSeconds: Number(process.env.IDENTITY_UPDATE_THROTTLE_TTL ?? "60"),
      identityUpdateThrottleLimit: Number(process.env.IDENTITY_UPDATE_THROTTLE_LIMIT ?? "10"),
      // No default: nonces and rate limits MUST be Redis-backed from this
      // stage on. Defaulting to some in-memory fallback here would silently
      // reintroduce the multi-instance replay hole this stage exists to
      // close, so a missing REDIS_URL fails fast at startup instead.
      redisUrl: requireEnv("REDIS_URL"),
      redisKeyPrefix: process.env.REDIS_KEY_PREFIX ?? "tip:",
    };
  }
}
