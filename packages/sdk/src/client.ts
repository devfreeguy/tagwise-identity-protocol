import { normalizeTag, TIP_REGISTRY_PROGRAM_ID } from "@tip/core";
import { getBase58Decoder, getBase64Decoder, getBase64Encoder } from "@solana/kit";

import { createRpc, resolveOnChainAccount, type SolanaRpc } from "./chain.js";
import { NoSessionError } from "./errors.js";
import { request } from "./http.js";
import { normalizeTagOrThrow } from "./validate.js";
import type {
  AvailabilityResponse,
  FetchLike,
  IdentityResponse,
  OnChainIdentity,
  PaymentLinkResponse,
  QrResponse,
  RegisterParams,
  ResolveResponse,
  SearchResultItem,
  Signer,
  TransactionSigner,
  UnsignedTransactionResponse,
  UpdateProfileFields,
} from "./types.js";

/** The public TIP API. Used as TipClientOptions.baseUrl's default so `new TipClient()` works with no arguments for the common case. */
export const DEFAULT_BASE_URL = "https://tip.tagwise.me";

export type TipClientOptions = Readonly<{
  /**
   * Base URL of a TIP API instance. Defaults to the public API
   * (DEFAULT_BASE_URL); override for local development or a different
   * deployment.
   */
  baseUrl?: string;
  /**
   * Solana RPC HTTP endpoint. Required for resolveOnChain() and for the
   * optional signAndSendTransaction() convenience; not required for any
   * API-backed method.
   */
  rpcUrl?: string;
  /**
   * Injectable fetch implementation, so this client works in any runtime
   * (browser, Node, React Native, edge workers, tests). Defaults to the
   * global fetch if one is available.
   */
  fetch?: FetchLike;
  /**
   * Advanced: inject a pre-built @solana/kit RPC client instead of letting
   * the SDK construct one from rpcUrl. Mainly useful for tests, or for an
   * app that wants to reuse an RPC client it already has configured with
   * its own retry/rate-limit wrapper.
   */
  rpc?: SolanaRpc;
  /**
   * The tip_registry program id used by resolveOnChain(). Defaults to
   * @tip/core's TIP_REGISTRY_PROGRAM_ID, the real deployed program.
   * Override for a local validator or a future migration to a different
   * deployment.
   */
  programId?: string;
}>;

function resolveDefaultFetch(): FetchLike {
  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }
  throw new Error(
    "no global fetch is available in this runtime; pass { fetch } explicitly to the TipClient constructor",
  );
}

/**
 * The TIP client. Construction never touches the network. Read methods
 * (resolve, identity, availability, search, qr, paymentLink) need no
 * session. Write methods (register, updateWallet, updateProfile) need a
 * connected session via connect(signer) first.
 */
export class TipClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly rpc: SolanaRpc | undefined;
  private readonly programId: string;
  private sessionToken: string | undefined;
  private sessionPubkey: string | undefined;

  constructor(options: TipClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetch ?? resolveDefaultFetch();
    this.rpc = options.rpc ?? (options.rpcUrl ? createRpc(options.rpcUrl) : undefined);
    this.programId = options.programId ?? TIP_REGISTRY_PROGRAM_ID;
  }

  // ---------------------------------------------------------------------
  // Reads. No auth required.
  // ---------------------------------------------------------------------

  async resolve(tag: string): Promise<ResolveResponse> {
    const normalized = normalizeTagOrThrow(tag);
    return request<ResolveResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "GET", path: `/v1/resolve/${normalized}` },
    });
  }

  async identity(tag: string): Promise<IdentityResponse> {
    const normalized = normalizeTagOrThrow(tag);
    return request<IdentityResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "GET", path: `/v1/identity/${normalized}` },
    });
  }

  /**
   * Unlike the other reads, a malformed tag here is not an error: it
   * mirrors the API's own availability contract by answering
   * { available: false, reason: "invalid" } directly, with no network call,
   * exactly like the server would answer had the round trip happened.
   */
  async availability(tag: string): Promise<AvailabilityResponse> {
    const result = normalizeTag(tag);
    if (!result.ok) {
      return { tag: `@${tag}`, available: false, reason: "invalid" };
    }
    return request<AvailabilityResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "GET", path: `/v1/availability/${result.tag}` },
    });
  }

  async search(q: string): Promise<SearchResultItem[]> {
    return request<SearchResultItem[]>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "GET", path: "/v1/search", query: { q } },
    });
  }

  async qr(tag: string): Promise<QrResponse> {
    const normalized = normalizeTagOrThrow(tag);
    return request<QrResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "GET", path: `/v1/qr/${normalized}` },
    });
  }

  async paymentLink(tag: string): Promise<PaymentLinkResponse> {
    const normalized = normalizeTagOrThrow(tag);
    return request<PaymentLinkResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "GET", path: `/v1/payment-link/${normalized}` },
    });
  }

  // ---------------------------------------------------------------------
  // Auth. Built around a Signer, never a private key.
  // ---------------------------------------------------------------------

  /** Requests a single-use sign-in challenge message for pubkey. Manual-control building block; connect() calls this for you. */
  async challenge(pubkey: string): Promise<string> {
    const { message } = await request<{ message: string }>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "POST", path: "/v1/auth/challenge", body: { pubkey } },
    });
    return message;
  }

  /**
   * Verifies a signed challenge message and stores the returned session
   * token in memory. Manual-control building block; connect() calls this
   * for you. signature must be the base58-encoded ed25519 signature over
   * the exact message bytes.
   */
  async verify(pubkey: string, message: string, signature: string): Promise<string> {
    const { token } = await request<{ token: string }>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "POST", path: "/v1/auth/verify", body: { pubkey, message, signature } },
    });
    this.sessionToken = token;
    this.sessionPubkey = pubkey;
    return token;
  }

  /**
   * Runs the full sign-in flow: request a challenge, ask the signer to sign
   * it, verify the signature, and store the resulting session token in
   * memory. Returns the authenticated pubkey.
   *
   * The signer is never asked for anything but a signature over the
   * challenge bytes; this SDK has no code path that accepts, stores, or
   * transmits a secret key.
   */
  async connect(signer: Signer): Promise<string> {
    const message = await this.challenge(signer.publicKey);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await signer.signMessage(messageBytes);
    const signatureBase58 = getBase58Decoder().decode(signatureBytes);
    await this.verify(signer.publicKey, message, signatureBase58);
    return signer.publicKey;
  }

  /** The in-memory session token, or undefined if not connected. Never persisted by this SDK; persist it yourself if you want it to survive a reload. */
  get token(): string | undefined {
    return this.sessionToken;
  }

  /** The connected pubkey, or undefined if not connected. */
  get connectedPubkey(): string | undefined {
    return this.sessionPubkey;
  }

  /**
   * Restores a previously issued session (for example one you persisted
   * yourself after a prior connect()), without repeating the challenge
   * flow. This SDK never reads from or writes to any storage on its own.
   */
  setSession(token: string, pubkey: string): void {
    this.sessionToken = token;
    this.sessionPubkey = pubkey;
  }

  /** Clears the in-memory session. Does not touch any storage, since this SDK never wrote to any. */
  disconnect(): void {
    this.sessionToken = undefined;
    this.sessionPubkey = undefined;
  }

  private requireSession(): string {
    if (!this.sessionToken) {
      throw new NoSessionError();
    }
    return this.sessionToken;
  }

  // ---------------------------------------------------------------------
  // Writes. Require a connected session. Never sign or submit by default.
  // ---------------------------------------------------------------------

  /**
   * Builds an unsigned register_tag transaction. Returns it exactly as the
   * API does (base64 transaction, derived pda, lastValidBlockHeight); this
   * SDK never signs or submits it. Hand the transaction to the connected
   * wallet for signing and submission.
   */
  async register(params: RegisterParams): Promise<UnsignedTransactionResponse> {
    const token = this.requireSession();
    const normalized = normalizeTagOrThrow(params.tag);
    return request<UnsignedTransactionResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: {
        method: "POST",
        path: "/v1/register",
        body: params.wallet ? { tag: normalized, wallet: params.wallet } : { tag: normalized },
        token,
      },
    });
  }

  /**
   * Builds an unsigned update_wallet transaction. Changing the payment
   * wallet is an on-chain operation; this never writes anything itself, it
   * only returns the transaction for the connected wallet to sign and
   * submit.
   */
  async updateWallet(tag: string, newWallet: string): Promise<UnsignedTransactionResponse> {
    const token = this.requireSession();
    const normalized = normalizeTagOrThrow(tag);
    return request<UnsignedTransactionResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "POST", path: `/v1/identity/${normalized}/wallet`, body: { wallet: newWallet }, token },
    });
  }

  /**
   * Patches the off-chain profile fields (displayName, avatar, bio,
   * preferredToken) and returns the updated identity. Omit a key to leave
   * it unchanged; pass null explicitly to clear it.
   */
  async updateProfile(tag: string, fields: UpdateProfileFields): Promise<IdentityResponse> {
    const token = this.requireSession();
    const normalized = normalizeTagOrThrow(tag);
    return request<IdentityResponse>({
      baseUrl: this.baseUrl,
      fetchImpl: this.fetchImpl,
      request: { method: "PATCH", path: `/v1/identity/${normalized}`, body: fields, token },
    });
  }

  /**
   * Optional convenience: signs an unsigned base64 transaction (as
   * returned by register() or updateWallet()) and submits it over RPC,
   * returning the transaction signature. Requires rpcUrl and a signer that
   * also exposes signTransaction, which most wallet adapters do.
   *
   * This is deliberately separate from register()/updateWallet(): the
   * default in this SDK is always to return the unsigned transaction and
   * let the caller's own wallet adapter take it from there. Use this only
   * if you want the SDK to do the sign-and-send for you.
   */
  async signAndSendTransaction(unsignedTransactionBase64: string, signer: TransactionSigner): Promise<string> {
    if (!this.rpc) {
      throw new Error("rpcUrl is required to sign and send a transaction");
    }
    const wireBytes = getBase64Encoder().encode(unsignedTransactionBase64);
    const signedBytes = await signer.signTransaction(new Uint8Array(wireBytes));
    const signedBase64 = getBase64Decoder().decode(signedBytes);
    return this.rpc.sendTransaction(signedBase64 as never, { encoding: "base64" }).send();
  }

  // ---------------------------------------------------------------------
  // Direct chain reads. The protocol property: works with no API at all.
  // ---------------------------------------------------------------------

  /**
   * Resolves a tag directly from the Solana account, with no API
   * involved: derives the PDA via @tip/core, fetches the account over RPC
   * with @solana/kit, and decodes it with @tip/core. This is what makes
   * TIP a protocol rather than just a service: if the API is unavailable,
   * anyone with an RPC endpoint can still resolve a tag straight from the
   * chain.
   *
   * Uses @tip/core's TIP_REGISTRY_PROGRAM_ID by default (the real deployed
   * program, the same constant across devnet and the eventual mainnet
   * deployment), or the programId passed to the TipClient constructor if
   * one was given (for a local validator or a future migration).
   *
   * Off-chain profile fields (displayName, avatar, bio, preferredToken)
   * are not stored on-chain and always come back null on this path; only
   * tag, owner, wallet, and bump are real on-chain data. verified and
   * merchant are mirror/moderation-only concepts and always come back
   * false here.
   */
  async resolveOnChain(tag: string): Promise<OnChainIdentity | null> {
    if (!this.rpc) {
      throw new Error("rpcUrl is required for resolveOnChain");
    }
    const normalized = normalizeTagOrThrow(tag);
    return resolveOnChainAccount(this.rpc, normalized, this.programId);
  }
}
