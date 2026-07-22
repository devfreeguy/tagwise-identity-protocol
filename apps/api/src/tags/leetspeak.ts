/**
 * Substitutions applied before re-checking a tag for profanity, to catch
 * common leetspeak and separator evasions (for example "f_u_c_k" or
 * "fvck"-style substitutions are not covered by character substitution
 * alone, but stripping underscores and mapping digits/symbols back to
 * letters closes the most common gaps).
 *
 * "1" and "!" could each stand for either "i" or "l" in leetspeak; this
 * table picks "i" for both, since that catches more real evasions of common
 * blocked words than "l" does. This is a deliberate, documented choice, not
 * an oversight.
 */
const LEETSPEAK_SUBSTITUTIONS: ReadonlyMap<string, string> = new Map([
  ["0", "o"],
  ["1", "i"],
  ["!", "i"],
  ["3", "e"],
  ["4", "a"],
  ["5", "s"],
  ["7", "t"],
  ["8", "b"],
  ["@", "a"],
]);

/**
 * Normalizes a tag for a second profanity re-check: strips underscores,
 * applies the leetspeak substitution table, then collapses runs of the same
 * repeated character down to one (so "ffuuuucck" collapses toward "fuck").
 * This is intentionally only used for the profanity re-check, never for
 * storage or display.
 */
export function normalizeForProfanityCheck(tag: string): string {
  const withoutUnderscores = tag.toLowerCase().replace(/_/g, "");

  let substituted = "";
  for (const char of withoutUnderscores) {
    substituted += LEETSPEAK_SUBSTITUTIONS.get(char) ?? char;
  }

  return substituted.replace(/(.)\1+/g, "$1");
}
