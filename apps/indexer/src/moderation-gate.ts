import type { NormalizedTag } from "@tip/core";
import { isBlockedName } from "@tip/moderation";

import type { Logger } from "./logger.js";

/**
 * Whether the mirror should mark a tag blocked. Profanity only, never
 * reserved: reserved names are legitimately registered on-chain to the
 * protocol wallet at launch (see packages/core's RESERVED_TAGS), so running
 * the reserved check here would auto-block the protocol's own tags in the
 * mirror the moment the indexer observed them. apps/api still checks
 * reserved at registration time (via @tip/moderation's checkModerationGate),
 * which is what actually stops a stranger from claiming one; by the time a
 * reserved tag reaches this function it is either the protocol's own, or a
 * program-level bug entirely outside this off-chain moderation layer's
 * remit.
 *
 * Shared by the live subscription, reconcile (both via apply-change.ts),
 * and the one-time backfill (backfill-moderation.ts), so all three apply
 * identical logic; see each call site for how the result is used.
 *
 * Fails safe: if the gate itself throws (a bug in the profanity engine, an
 * unexpected input shape), the tag is treated as passing rather than
 * crashing the indexer or blocking on an unrelated failure. Logged at WARN
 * so this is never silent. Mirroring correctness outweighs a missed block,
 * and a missed block here is caught by the next reconcile or backfill pass.
 */
export function shouldBlockTag(tag: NormalizedTag, logger: Logger): boolean {
  try {
    return isBlockedName(tag).blocked;
  } catch (error) {
    logger.warn({ tag, err: error }, "moderation gate check threw, leaving tag active (fail safe)");
    return false;
  }
}
