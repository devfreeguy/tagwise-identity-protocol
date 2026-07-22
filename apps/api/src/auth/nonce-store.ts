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
 * RedisNonceStore (redis-nonce-store.ts) is the only production
 * implementation from stage 2a on: in-memory nonces do not survive a restart
 * and are not shared across instances, so a caller whose challenge landed on
 * one instance could never verify against another, and a restart silently
 * drops every outstanding challenge. That is a deploy blocker, not a
 * tradeoff, which is why AuthModule wires RedisNonceStore unconditionally.
 */
export interface NonceStore {
  put(pubkey: string, nonce: string, ttlSeconds: number): Promise<void>;
  take(pubkey: string, nonce: string): Promise<NonceRecord | null>;
}

export const NONCE_STORE = Symbol("NONCE_STORE");

function keyOf(pubkey: string, nonce: string): string {
  return `${pubkey}:${nonce}`;
}

/**
 * TEST-ONLY. Not exported from anywhere production code imports, and never
 * registered as the NONCE_STORE provider: AuthModule always wires
 * RedisNonceStore. This exists purely so AuthService's unit tests can run
 * against a trivial in-process NonceStore without pulling in Redis, and has
 * no TTL reaper of its own; expiry is checked on read, exactly like Redis
 * expiry is authoritative for RedisNonceStore.
 */
export class InMemoryNonceStore implements NonceStore {
  private readonly entries = new Map<string, NonceRecord>();

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
}
