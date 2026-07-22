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
 * The deployed tip-registry program id. This is the real devnet deployment,
 * using the program keypair that is also intended for the eventual mainnet
 * deployment, so this same constant holds across clusters (devnet today,
 * mainnet later), not just one of them.
 */
export const TIP_REGISTRY_PROGRAM_ID: string = "4vcgrBuzoWw3kBanVTtx7Pi1v9WyTJBJQsFAQMqjJZjx";
