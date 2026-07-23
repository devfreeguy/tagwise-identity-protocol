import { isReservedTag, type NormalizedTag } from "@tip/core";

import { isBlockedName } from "./profanity.js";

export type ModerationGateReason = "reserved" | "inappropriate";

export type ModerationGateResult =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; reason: ModerationGateReason }>;

/**
 * The full moderation gate: reserved check first (cheap exact match), then
 * profanity (leetspeak-aware, allowlisted). This is the check apps/api runs
 * at registration time, where a stranger attempting to claim a reserved
 * name must be stopped before it ever reaches the chain.
 *
 * apps/indexer does NOT call this function. Reserved names are legitimately
 * registered on-chain to the protocol wallet at launch, so running the
 * reserved check against already-mirrored rows would incorrectly flag the
 * protocol's own tags as violations. apps/indexer calls isBlockedName
 * directly instead (profanity only); see apps/indexer/src/moderation-gate.ts
 * for that reasoning in full.
 */
export function checkModerationGate(tag: NormalizedTag): ModerationGateResult {
  if (isReservedTag(tag)) {
    return { allowed: false, reason: "reserved" };
  }

  const profanity = isBlockedName(tag);
  if (profanity.blocked) {
    return { allowed: false, reason: "inappropriate" };
  }

  return { allowed: true };
}
