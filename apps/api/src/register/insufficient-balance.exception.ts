import { HttpException, HttpStatus } from "@nestjs/common";

import type { InsufficientBalanceDetails } from "./rent-check.js";

/**
 * A specific, actionable 402 instead of letting a raw Solana or RPC error
 * surface. Lamports are returned as strings since JSON has no bigint type.
 */
export class InsufficientBalanceException extends HttpException {
  constructor(details: InsufficientBalanceDetails) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message: "insufficient balance to cover rent and fees for this registration",
        requiredLamports: details.requiredLamports.toString(),
        currentLamports: details.currentLamports.toString(),
        shortfallLamports: details.shortfallLamports.toString(),
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
