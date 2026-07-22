export type NonceRecord = Readonly<{
  pubkey: string;
  nonce: string;
  expiresAt: number;
}>;

/**
 * Seam for single-use nonce storage. put() stores a nonce bound to a
 * pubkey with a TTL; take() atomically consumes it, returning the record if
 * it existed and had not expired, or null if it was missing, expired, or
 * already consumed. That consume-on-read behavior is what prevents replay:
 * once a nonce is taken, it can never be taken again.
 *
 * InMemoryNonceStore is the only implementation this stage. A Redis-backed
 * NonceStore lands in stage 2 and is REQUIRED before running more than one
 * instance or before production: in-memory nonces do not survive a restart
 * and are not shared across instances, so a caller whose challenge landed on
 * one instance could never verify against another. This stage is
 * single-instance dev only.
 */
export interface NonceStore {
  put(pubkey: string, nonce: string, ttlSeconds: number): Promise<void>;
  take(pubkey: string, nonce: string): Promise<NonceRecord | null>;
}

export const NONCE_STORE = Symbol("NONCE_STORE");

function keyOf(pubkey: string, nonce: string): string {
  return `${pubkey}:${nonce}`;
}

export class InMemoryNonceStore implements NonceStore {
  private readonly entries = new Map<string, NonceRecord>();
  private readonly cleanupTimer: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupIntervalMs);
    this.cleanupTimer.unref?.();
  }

  async put(pubkey: string, nonce: string, ttlSeconds: number): Promise<void> {
    const key = keyOf(pubkey, nonce);
    this.entries.set(key, { pubkey, nonce, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async take(pubkey: string, nonce: string): Promise<NonceRecord | null> {
    const key = keyOf(pubkey, nonce);
    const record = this.entries.get(key);
    // Deleting unconditionally, whether or not the entry is still valid,
    // means a second take() call for the same key can never succeed again,
    // even in the narrow window right at expiry.
    this.entries.delete(key);

    if (!record) {
      return null;
    }
    if (record.expiresAt < Date.now()) {
      return null;
    }
    return record;
  }

  /** Proactively drops expired entries so abandoned nonces do not accumulate. */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.entries) {
      if (record.expiresAt < now) {
        this.entries.delete(key);
      }
    }
  }

  /** Stops the periodic cleanup timer; used on application shutdown. */
  destroy(): void {
    clearInterval(this.cleanupTimer);
  }
}
