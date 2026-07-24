/**
 * Shapes mirrored from apps/api's DTOs. Kept as plain types (not classes)
 * since this package ships to browsers and has no reason to depend on
 * class-validator/class-transformer or any server-side decorator library.
 */

export type ResolveLinks = Readonly<{
  profile: string;
  qr: string;
}>;

export type ResolveResponse = Readonly<{
  tag: string;
  wallet: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  merchant: boolean;
  preferredToken: string | null;
  paymentLink: string;
  links: ResolveLinks;
}>;

export type IdentityResponse = Readonly<{
  tag: string;
  owner: string;
  wallet: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  preferredToken: string | null;
  verified: boolean;
  merchant: boolean;
  createdAt: string;
}>;

export type AvailabilityReason = "available" | "invalid" | "reserved" | "inappropriate" | "already_registered";

export type AvailabilityResponse = Readonly<{
  tag: string;
  available: boolean;
  reason: string;
}>;

export type SearchResultItem = Readonly<{
  tag: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
}>;

export type QrResponse = Readonly<{
  tag: string;
  wallet: string;
  paymentLink: string;
}>;

export type PaymentLinkResponse = Readonly<{
  tag: string;
  wallet: string;
  paymentLink: string;
}>;

/** Base64-encoded unsigned transaction plus the context needed to sign and submit it. */
export type UnsignedTransactionResponse = Readonly<{
  transaction: string;
  pda: string;
  lastValidBlockHeight: string;
}>;

export type RegisterParams = Readonly<{
  tag: string;
  /** Base58 wallet address to receive payments. Defaults to the connected owner pubkey if omitted. */
  wallet?: string;
  /**
   * Base58 address of a sponsor who pays the account rent and network fee
   * on the owner's behalf. Defaults to the connected owner pubkey (self-paid)
   * if omitted. When supplied and different from the owner, the resulting
   * transaction requires signatures from BOTH the owner and feePayer before
   * it can be submitted.
   */
  feePayer?: string;
}>;

/**
 * Any subset of the four off-chain profile fields. Omitting a key leaves
 * that column unchanged on the server; passing null explicitly clears it.
 * This matches apps/api's PATCH /v1/identity/:tag semantics exactly.
 */
export type UpdateProfileFields = Readonly<{
  displayName?: string | null;
  avatar?: string | null;
  bio?: string | null;
  preferredToken?: string | null;
}>;

/**
 * A wallet-adapter-shaped signer. This is the ONLY way the SDK ever
 * interacts with signing: it is never given, and never asks for, a secret
 * key. publicKey is the base58 Solana address; signMessage signs arbitrary
 * bytes (used for the sign-in challenge) and returns the raw signature
 * bytes.
 */
export type Signer = Readonly<{
  publicKey: string;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
}>;

/**
 * Optional extension of Signer for the opt-in signAndSendTransaction
 * convenience. Most wallet adapters expose something shaped like this;
 * the SDK never assumes it is present.
 */
export type TransactionSigner = Signer &
  Readonly<{
    signTransaction(transaction: Uint8Array): Promise<Uint8Array>;
  }>;

/** Injectable fetch signature, matching the global fetch function shape so any implementation (native, node, polyfill) works. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * The result of resolveOnChain(): only real on-chain fields (tag, owner,
 * wallet, bump). Off-chain profile fields do not exist on-chain and are
 * always null; verified and merchant are mirror/moderation-only concepts
 * with no on-chain equivalent and are always false.
 */
export type OnChainIdentity = Readonly<{
  tag: string;
  owner: string;
  wallet: string;
  bump: number;
  displayName: null;
  avatar: null;
  bio: null;
  preferredToken: null;
  verified: false;
  merchant: false;
}>;
