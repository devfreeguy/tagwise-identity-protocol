/**
 * Substitutions applied before re-checking a tag for profanity, to catch
 * common leetspeak and separator evasions (for example "f_u_c_k" is not
 * covered by character substitution alone, but stripping underscores closes
 * that gap).
 *
 * Only digits and underscore are mapped here. The gate that calls this
 * always runs after @tip/core normalizeTag has already accepted the tag, so
 * the input is guaranteed to be a-z0-9_ only; "!" and "@" can never appear
 * in a canonical tag, so mapping them would be dead code.
 *
 * Some digits are ambiguous in real leetspeak usage: "1" can stand for
 * either "i" or "l". Each entry below is the full list of letters that
 * digit could plausibly represent, not just one pick. See
 * generateProfanityCheckVariants for how these are combined.
 */
const LEETSPEAK_SUBSTITUTIONS: ReadonlyMap<string, readonly string[]> = new Map([
  ["0", ["o"]],
  ["1", ["i", "l"]],
  ["2", ["z"]],
  ["3", ["e"]],
  ["4", ["a"]],
  ["5", ["s"]],
  ["6", ["g"]],
  ["7", ["t"]],
  ["8", ["b"]],
  ["9", ["g"]],
]);

// Bounds how many candidate variants a single tag can produce. Only "1" is
// ambiguous (2 options), so a tag that is mostly the digit "1" is the
// pathological case; this cap keeps that bounded instead of growing to 2^20
// for a 20-character tag of all "1"s. Every realistic evasion attempt is
// far short of this cap and gets fully, exhaustively checked.
const MAX_VARIANTS = 4096;

/**
 * Generates every plausible leetspeak/evasion variant of a tag: underscores
 * stripped, each digit expanded to all the letters it could plausibly
 * represent (a tag with multiple ambiguous digits produces multiple
 * variants, one per combination), then each variant has its runs of the
 * same repeated character collapsed to one (so "ffuuuucck" collapses
 * toward "fuck"). Every variant must be checked; matching on any one of
 * them means the tag is blocked. This is intentionally only used for the
 * profanity re-check, never for storage or display.
 */
export function generateProfanityCheckVariants(tag: string): string[] {
  const prepared = tag.toLowerCase().replace(/_/g, "");

  let variants: string[] = [""];
  for (const char of prepared) {
    const options = LEETSPEAK_SUBSTITUTIONS.get(char) ?? [char];
    const next: string[] = [];
    for (const variant of variants) {
      for (const option of options) {
        next.push(variant + option);
        if (next.length >= MAX_VARIANTS) {
          break;
        }
      }
      if (next.length >= MAX_VARIANTS) {
        break;
      }
    }
    variants = next;
  }

  const collapsed = variants.map((variant) => variant.replace(/(.)\1+/g, "$1"));
  return Array.from(new Set(collapsed));
}
