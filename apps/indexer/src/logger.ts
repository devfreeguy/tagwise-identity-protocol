import pino from "pino";

/**
 * @solana/errors' SolanaError freezes its `.context` property. Pino's default
 * err serializer recurses into any property that looks error-like (has a
 * string `message`, which RPC error contexts do) and tags it with a Symbol to
 * guard against circular refs - mutating a frozen object throws and crashes
 * the process before anything gets logged. Swap in a fresh, unfrozen copy so
 * serialization can never fail on this shape.
 */
function errSerializer(err: unknown) {
  if (err && typeof err === "object" && "context" in err) {
    const context = (err as { context?: unknown }).context;
    if (context && typeof context === "object" && !Object.isExtensible(context)) {
      (err as { context?: unknown }).context = { ...(context as object) };
    }
  }
  return pino.stdSerializers.err(err as Error);
}

export const logger = pino({
  name: "tip-indexer",
  level: process.env.LOG_LEVEL ?? "info",
  serializers: { err: errSerializer },
});

export type Logger = typeof logger;
