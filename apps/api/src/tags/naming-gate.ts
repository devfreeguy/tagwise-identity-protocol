import type { NormalizedTag } from "@tip/core";
import type { PrismaClient } from "@tip/db";
import { checkModerationGate } from "@tip/moderation";

export type NamingGateReason = "available" | "reserved" | "inappropriate" | "already_registered";

export type NamingGateResult =
  | Readonly<{ available: true; reason: "available" }>
  | Readonly<{ available: false; reason: "reserved" | "inappropriate" | "already_registered" }>;

/**
 * Runs the full naming gate against an already-canonical tag, in the exact
 * required order:
 * 1. The shared moderation gate (@tip/moderation): reserved check (cheap
 *    exact match) before the profanity check (fuzzy substring matching), so
 *    an obviously reserved name never pays for the more expensive check.
 * 2. Mirror check: an existing active row makes the tag taken. A blocked
 *    row also counts as taken, matching the rest of the public API's
 *    treatment of blocked rows as invisible.
 *
 * Canonical-form validation is the caller's responsibility via normalizeTag
 * before this is ever invoked; a NormalizedTag cannot represent invalid
 * input, so this function never needs to consider that case.
 */
export async function checkNamingGate(db: PrismaClient, tag: NormalizedTag): Promise<NamingGateResult> {
  const moderation = checkModerationGate(tag);
  if (!moderation.allowed) {
    return { available: false, reason: moderation.reason };
  }

  const row = await db.identity.findUnique({ where: { tag }, select: { status: true } });
  if (row !== null) {
    return { available: false, reason: "already_registered" };
  }

  return { available: true, reason: "available" };
}
