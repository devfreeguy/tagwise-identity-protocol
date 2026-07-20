import {
  address,
  getProgramDerivedAddress,
  type Address,
  type ProgramDerivedAddress,
} from "@solana/addresses";

import type { NormalizedTag } from "./normalize.js";
import { buildTagSeeds } from "./seeds.js";

/**
 * Derives the PDA and bump for a tag account.
 *
 * `normalizedTag` must be a NormalizedTag, obtainable only from
 * normalizeTag, so passing an unnormalized string is a compile error.
 * `programId` is the base58-encoded tip-registry program address. Seeds are
 * always built by calling buildTagSeeds, never re-derived inline, so this
 * stays the single place that talks to the Solana library.
 */
export async function deriveTagPda(
  normalizedTag: NormalizedTag,
  programId: string,
): Promise<ProgramDerivedAddress> {
  const seeds = buildTagSeeds(normalizedTag);
  const programAddress: Address = address(programId);
  return getProgramDerivedAddress({
    programAddress,
    seeds,
  });
}
