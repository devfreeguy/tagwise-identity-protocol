/**
 * Seam for the cold-path chain read: when both the cache and the mirror
 * miss, a real implementation could read the tip_registry account directly
 * from Solana via @solana/kit. That real implementation lands in stage 2,
 * registered as the CHAIN_FALLBACK provider in TagsModule; this stage only
 * ever returns not-found, so a mirror miss is a 404.
 */
export interface ChainFallback<T = unknown> {
  lookup(tag: string): Promise<T | undefined>;
}

export const CHAIN_FALLBACK = Symbol("CHAIN_FALLBACK");

export class NotFoundChainFallback<T = unknown> implements ChainFallback<T> {
  async lookup(_tag: string): Promise<T | undefined> {
    return undefined;
  }
}
