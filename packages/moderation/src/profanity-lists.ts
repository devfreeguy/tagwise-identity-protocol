/**
 * Plain, editable data only, no logic. Curated by the author and expected to
 * grow over time.
 *
 * ALLOWLIST holds real words that contain a rude substring purely by
 * coincidence. Because tags have no spaces, the profanity check in
 * profanity.ts must use substring matching, which makes false positives on
 * words like these unavoidable unless they are explicitly allowed first.
 */
export const ALLOWLIST: ReadonlySet<string> = new Set([
  "analyze",
  "analyse",
  "assess",
  "assassin",
  "classic",
  "bass",
  "grass",
  "pass",
  "password",
  "shiitake",
  "cockpit",
  "cocktail",
  "scunthorpe",
  "penistone",
  "essex",
  "sussex",
  "matsushita",
]);

/**
 * Extra terms to block beyond what the @2toad/profanity engine already
 * covers. Kept separate from the engine so the author can curate it without
 * touching any matching logic.
 */
export const EXTRA_BLOCKED_TERMS: ReadonlySet<string> = new Set([]);
