export { DEFAULT_BASE_URL, TipClient, type TipClientOptions } from "./client.js";

export {
  ForbiddenError,
  InsufficientBalanceError,
  NoSessionError,
  RateLimitedError,
  TagInvalidError,
  TagNotFoundError,
  TipApiError,
  TipError,
  UnauthorizedError,
  UnexpectedApiError,
  ValidationError,
} from "./errors.js";

export type {
  AvailabilityReason,
  AvailabilityResponse,
  FetchLike,
  IdentityResponse,
  OnChainIdentity,
  PaymentLinkResponse,
  QrResponse,
  RegisterParams,
  ResolveLinks,
  ResolveResponse,
  SearchResultItem,
  Signer,
  TransactionSigner,
  UnsignedTransactionResponse,
  UpdateProfileFields,
} from "./types.js";

// Re-exported so integrators can validate tags locally without a network
// round trip and without depending on @tip/core directly themselves.
// Deliberately NOT re-exported: buildResolveCacheKey and anything else
// internal to how apps/api and apps/indexer coordinate caching; those are
// implementation details of the protocol's off-chain mirror, not part of
// its public client surface. decodeTagAccount and the account-buffer
// layout are also not re-exported here: resolveOnChain() already returns
// decoded fields directly, so integrators should not need to decode raw
// account bytes themselves.
export {
  ALLOWED_TAG_CHARACTERS_PATTERN,
  deriveTagPda,
  isReservedTag,
  isValidTag,
  MAX_TAG_LENGTH,
  MIN_TAG_LENGTH,
  normalizeTag,
  RESERVED_TAGS,
  type NormalizedTag,
  type NormalizeTagResult,
  type TagAccepted,
  type TagRejection,
  type TagRejectionReason,
} from "@tip/core";
