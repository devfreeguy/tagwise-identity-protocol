import { address, getBase64Decoder, type Transaction, type TransactionMessageBytesBase64 } from "@solana/kit";
import { TAG_ACCOUNT_SIZE } from "@tip/core";

import type { ApiRpc } from "../solana/rpc.js";

export type InsufficientBalanceDetails = Readonly<{
  requiredLamports: bigint;
  currentLamports: bigint;
  shortfallLamports: bigint;
}>;

export type RentCheckResult =
  | Readonly<{ sufficient: true }>
  | Readonly<{ sufficient: false; details: InsufficientBalanceDetails }>;

const base64Decoder = getBase64Decoder();
const TAG_ACCOUNT_SIZE_BIGINT = BigInt(TAG_ACCOUNT_SIZE);

// Used only if the RPC node cannot estimate a fee for the message (rare);
// 5000 lamports is the well-known base fee per signature on Solana today.
// The primary path always asks the RPC, never hardcodes this as truth.
const FEE_ESTIMATE_FALLBACK_LAMPORTS = 5000n;

/**
 * Computes the actual lamports required to register a tag: the rent-exempt
 * cost for a TagAccount-sized account (fetched from the RPC for
 * TAG_ACCOUNT_SIZE, never hardcoded) plus the real fee for this specific
 * compiled transaction (also fetched from the RPC), then compares that to
 * the fee payer's current balance.
 */
export async function checkSufficientBalance(params: {
  rpc: ApiRpc;
  feePayer: string;
  transaction: Transaction;
}): Promise<RentCheckResult> {
  const messageBase64 = base64Decoder.decode(
    params.transaction.messageBytes,
  ) as unknown as TransactionMessageBytesBase64;

  const [rentExemptLamports, feeResponse, balanceResponse] = await Promise.all([
    params.rpc.getMinimumBalanceForRentExemption(TAG_ACCOUNT_SIZE_BIGINT).send(),
    params.rpc.getFeeForMessage(messageBase64, { commitment: "confirmed" }).send(),
    params.rpc.getBalance(address(params.feePayer), { commitment: "confirmed" }).send(),
  ]);

  const feeLamports = feeResponse.value ?? FEE_ESTIMATE_FALLBACK_LAMPORTS;
  const requiredLamports = rentExemptLamports + feeLamports;
  const currentLamports = balanceResponse.value;

  if (currentLamports >= requiredLamports) {
    return { sufficient: true };
  }

  return {
    sufficient: false,
    details: {
      requiredLamports,
      currentLamports,
      shortfallLamports: requiredLamports - currentLamports,
    },
  };
}
