import "dotenv/config";

export type IndexerConfig = Readonly<{
  rpcHttpUrl: string;
  rpcWssUrl: string;
  programId: string;
  databaseUrl: string;
  commitment: "processed" | "confirmed" | "finalized";
  reconcileCron: string;
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

function resolveRpcUrls(): { httpUrl: string; wssUrl: string } {
  const httpUrl = process.env.RPC_HTTP_URL;
  const wssUrl = process.env.RPC_WSS_URL;
  if (httpUrl && wssUrl) {
    return { httpUrl, wssUrl };
  }

  const apiKey = process.env.HELIUS_API_KEY;
  if (apiKey) {
    return {
      httpUrl: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
      wssUrl: `wss://devnet.helius-rpc.com/?api-key=${apiKey}`,
    };
  }

  throw new Error(
    "missing RPC configuration: set RPC_HTTP_URL and RPC_WSS_URL directly, or set HELIUS_API_KEY",
  );
}

function resolveCommitment(): IndexerConfig["commitment"] {
  const raw = process.env.COMMITMENT ?? "finalized";
  if (raw !== "processed" && raw !== "confirmed" && raw !== "finalized") {
    throw new Error(
      `invalid COMMITMENT ${JSON.stringify(raw)}, expected "processed", "confirmed", or "finalized"`,
    );
  }
  return raw;
}

/**
 * Loads and validates all indexer configuration from the environment. Called
 * once at startup; nothing here is hardcoded, including the program id and
 * cluster, so pointing at a different network is purely an env change.
 */
export function loadConfig(): IndexerConfig {
  const { httpUrl, wssUrl } = resolveRpcUrls();

  return {
    rpcHttpUrl: httpUrl,
    rpcWssUrl: wssUrl,
    programId: requireEnv("TIP_REGISTRY_PROGRAM_ID"),
    databaseUrl: requireEnv("DATABASE_URL"),
    commitment: resolveCommitment(),
    reconcileCron: process.env.RECONCILE_CRON ?? "0 3 * * *",
    // No default: cache invalidation is what keeps apps/api's resolve cache
    // correct rather than merely eventually-consistent via TTL, so a
    // missing REDIS_URL fails fast at startup instead of silently mirroring
    // with invalidation disabled.
    redisUrl: requireEnv("REDIS_URL"),
    // MUST match apps/api's REDIS_KEY_PREFIX exactly. This app deletes the
    // key apps/api's buildResolveCacheKey (from @tip/core) writes; if the
    // prefixes differ, every delete misses silently and stale resolve
    // responses are served until TTL expires, with no error anywhere.
    redisKeyPrefix: process.env.REDIS_KEY_PREFIX ?? "tip:",
  };
}
