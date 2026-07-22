import { Profanity } from "@2toad/profanity";

import { normalizeForProfanityCheck } from "./leetspeak.js";
import { ALLOWLIST, EXTRA_BLOCKED_TERMS } from "./profanity-lists.js";

export type BlockedNameResult = Readonly<{ blocked: false }> | Readonly<{ blocked: true; reason: "profanity" }>;

// wholeWord is disabled deliberately: tags contain no spaces, so whole-word
// matching would never match anything. Substring matching is required,
// which is exactly why the allowlist below is mandatory, not optional.
const profanityEngine = new Profanity({ wholeWord: false });

function containsBlockedContent(candidate: string): boolean {
  if (profanityEngine.exists(candidate)) {
    return true;
  }
  for (const term of EXTRA_BLOCKED_TERMS) {
    if (candidate.includes(term)) {
      return true;
    }
  }
  return false;
}

/**
 * Strict, substring-based profanity check for tags.
 *
 * Order matters:
 * 1. The allowlist is checked first and short-circuits to allowed. This
 *    must run before any substring matching, or real words like "analyze"
 *    or "scunthorpe" would be wrongly blocked.
 * 2. The raw (already-canonical, lowercase) tag is checked against the
 *    @2toad/profanity engine and the extra author-curated blocked terms.
 * 3. A leetspeak/evasion-normalized form of the same tag (underscores
 *    stripped, common substitutions reversed, repeated characters
 *    collapsed, see leetspeak.ts) is re-checked against the same engine and
 *    terms, to catch evasions like "f_u_c_k" or "fvck" that the raw form
 *    would not match.
 */
export function isBlockedName(tag: string): BlockedNameResult {
  const lower = tag.toLowerCase();

  if (ALLOWLIST.has(lower)) {
    return { blocked: false };
  }

  if (containsBlockedContent(lower)) {
    return { blocked: true, reason: "profanity" };
  }

  const normalized = normalizeForProfanityCheck(lower);
  if (containsBlockedContent(normalized)) {
    return { blocked: true, reason: "profanity" };
  }

  return { blocked: false };
}
