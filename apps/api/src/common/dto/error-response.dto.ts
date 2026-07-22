import { ApiProperty } from "@nestjs/swagger";

/**
 * Shared shape for error bodies with no business-specific reason code
 * (missing/invalid bearer token, tag not found). GlobalExceptionFilter
 * always sets statusCode from the real HTTP status, never from the thrown
 * exception's payload.
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: "tag @daniel not found" })
  message!: string;
}

/** 400: the :tag path param failed canonical-form validation (normalizeTag). */
export class TagFormatErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: "invalid tag: TOO_SHORT" })
  message!: string;

  @ApiProperty({
    description: "EMPTY, BAD_AT, TOO_SHORT, TOO_LONG, or INVALID_CHAR",
    enum: ["EMPTY", "BAD_AT", "TOO_SHORT", "TOO_LONG", "INVALID_CHAR"],
    example: "TOO_SHORT",
  })
  reason!: string;
}

/** 400: the wallet field is not a valid base58 Solana address. */
export class WalletFormatErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: "wallet is not a valid base58 Solana address" })
  message!: string;

  @ApiProperty({ enum: ["INVALID_WALLET"], example: "INVALID_WALLET" })
  reason!: string;
}

/** 403: the tag is reserved, or its content failed the profanity filter. */
export class TagUnavailableErrorDto {
  @ApiProperty({ example: 403 })
  statusCode!: number;

  @ApiProperty({ example: "tag is not available: reserved" })
  message!: string;

  @ApiProperty({ description: "reserved or inappropriate", enum: ["reserved", "inappropriate"], example: "reserved" })
  reason!: string;
}

/** 409: an active row for this tag already exists in the mirror. */
export class TagAlreadyRegisteredErrorDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: "tag is already registered" })
  message!: string;

  @ApiProperty({ enum: ["already_registered"], example: "already_registered" })
  reason!: string;
}

/** 403: displayName or bio failed the profanity filter on a profile update. */
export class ContentBlockedErrorDto {
  @ApiProperty({ example: 403 })
  statusCode!: number;

  @ApiProperty({ example: "displayName is not allowed: profanity" })
  message!: string;

  @ApiProperty({ enum: ["profanity"], example: "profanity" })
  reason!: string;
}

/**
 * 402: the fee payer cannot cover rent-exemption plus the network fee for
 * this transaction. Lamport amounts are strings since JSON has no bigint.
 */
export class InsufficientBalanceResponseDto {
  @ApiProperty({ example: 402 })
  statusCode!: number;

  @ApiProperty({ example: "insufficient balance to cover rent and fees for this registration" })
  message!: string;

  @ApiProperty({ description: "Lamports required: rent exemption plus the network fee", example: "1461600" })
  requiredLamports!: string;

  @ApiProperty({ description: "The fee payer's current balance, in lamports", example: "500000" })
  currentLamports!: string;

  @ApiProperty({ description: "requiredLamports minus currentLamports", example: "961600" })
  shortfallLamports!: string;
}
