import type { TagRejectionReason } from "@tip/core";

/**
 * Base class for every error this SDK throws. Callers can catch this one
 * type to handle "something about this TIP call failed" broadly, or catch
 * one of the specific subclasses below to handle a particular case.
 */
export class TipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * A tag failed client-side validation via @tip/core's normalizeTag, before
 * any network call was made. reason is the exact same code the API itself
 * would use for the same input, so callers do not need to special-case
 * client-side versus server-side rejection.
 */
export class TagInvalidError extends TipError {
  readonly reason: TagRejectionReason;

  constructor(tag: string, reason: TagRejectionReason) {
    super(`tag ${JSON.stringify(tag)} is invalid: ${reason}`);
    this.reason = reason;
  }
}

/** Base class for every error that came back from a real HTTP response. */
export class TipApiError extends TipError {
  readonly statusCode: number;
  readonly body: unknown;

  constructor(message: string, statusCode: number, body: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
  }
}

/** The API returned 404: the tag does not exist, or is blocked (the API never distinguishes the two to a caller). */
export class TagNotFoundError extends TipApiError {}

/**
 * The API returned 401: missing, malformed, or expired session token. The
 * SDK never silently re-signs to recover from this, since that would pop an
 * unexpected wallet prompt; the caller must call connect() again.
 */
export class UnauthorizedError extends TipApiError {
  constructor(body: unknown) {
    super("session expired or invalid, call connect() again to reconnect", 401, body);
  }
}

/** The API returned 403: the connected session does not own this tag, or the naming gate rejected the content. */
export class ForbiddenError extends TipApiError {}

/** The API returned 429: too many requests. */
export class RateLimitedError extends TipApiError {}

/**
 * The API returned 402: the fee payer does not have enough SOL to cover
 * rent and fees for this registration. Carries the exact lamport amounts so
 * an app can show the user precisely how much more SOL they need.
 */
export class InsufficientBalanceError extends TipApiError {
  readonly requiredLamports: bigint;
  readonly currentLamports: bigint;
  readonly shortfallLamports: bigint;

  constructor(body: {
    message?: string;
    requiredLamports: string;
    currentLamports: string;
    shortfallLamports: string;
  }) {
    super(body.message ?? "insufficient balance to cover rent and fees", 402, body);
    this.requiredLamports = BigInt(body.requiredLamports);
    this.currentLamports = BigInt(body.currentLamports);
    this.shortfallLamports = BigInt(body.shortfallLamports);
  }
}

/** The API returned 400: malformed request (a field the SDK did not already validate client-side, or a field only the server checks, like preferredToken's pattern). */
export class ValidationError extends TipApiError {
  readonly reason: string | undefined;

  constructor(message: string, body: unknown, reason?: string) {
    super(message, 400, body);
    this.reason = reason;
  }
}

/** A write was attempted (register, updateWallet, updateProfile) without a connected session. Thrown client-side, before any network call. */
export class NoSessionError extends TipError {
  constructor() {
    super("no connected session: call connect(signer) before calling this method");
  }
}

/** Any other non-2xx response this client does not have a more specific type for. */
export class UnexpectedApiError extends TipApiError {}
