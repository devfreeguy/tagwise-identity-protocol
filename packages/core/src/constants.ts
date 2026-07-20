/**
 * Seed prefix used as the first PDA seed for every tag account.
 */
export const TAG_SEED_PREFIX = "tag";

/**
 * Minimum allowed length of a normalized tag.
 */
export const MIN_TAG_LENGTH = 3;

/**
 * Maximum allowed length of a normalized tag.
 */
export const MAX_TAG_LENGTH = 20;

/**
 * A normalized tag must match this pattern in full: lowercase ASCII letters,
 * digits, and underscore only.
 */
export const ALLOWED_TAG_CHARACTERS_PATTERN = /^[a-z0-9_]+$/;

/**
 * The deployed tip-registry program id. This is intentionally left unset.
 * Fill it in once the program has been deployed and the real address is
 * known. Do not replace this with a fabricated or placeholder-looking
 * address.
 */
export const TIP_REGISTRY_PROGRAM_ID: string | null = null;
