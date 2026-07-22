/**
 * Names that would be confusing or abusable in a payments identity protocol
 * if a stranger, rather than the protocol itself, held them. This list is
 * curated by the author and is expected to grow over time; it is not
 * generated or derived from any external source.
 *
 * Every entry is already lowercase, matching the normalized tag form these
 * are compared against.
 */
export const RESERVED_TAGS: ReadonlySet<string> = Object.freeze(
  new Set([
    "admin",
    "administrator",
    "support",
    "help",
    "helpdesk",
    "official",
    "verify",
    "verified",
    "security",
    "billing",
    "payment",
    "payments",
    "wallet",
    "refund",
    "root",
    "system",
    "api",
    "www",
    "mail",
    "about",
    "settings",
    "login",
    "signup",
    "team",
    "staff",
    "moderator",
    "mod",
    "tip",
    "tagwise",
    "tagwise_official",
  ]),
);

/**
 * Exact match only, against an already-normalized tag. Reserved names are a
 * small, stable, shareable list; this does no fuzzy or substring matching,
 * unlike the profanity check, which lives in the API, not here.
 */
export function isReservedTag(tag: string): boolean {
  return RESERVED_TAGS.has(tag);
}
