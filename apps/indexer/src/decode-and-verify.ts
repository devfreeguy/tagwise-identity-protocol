import type { Address } from "@solana/kit";
import { decodeTagAccount, deriveTagPda, type NormalizedTag } from "@tip/core";

export type VerifiedTagChange = Readonly<{
  address: Address;
  tag: NormalizedTag;
  owner: Address;
  wallet: Address;
  bump: number;
  slot: bigint;
}>;

export type DecodeVerifyResult =
  | Readonly<{ ok: true; change: VerifiedTagChange }>
  | Readonly<{ ok: false; reason: string }>;

/**
 * Decodes a raw account buffer and verifies it before it is ever trusted as a
 * real tag change: decodeTagAccount already enforces the discriminator and
 * canonical-tag checks, and this additionally re-derives the PDA from the
 * decoded tag and asserts it equals the address the notification arrived
 * under. Anything that fails either check is rejected, never partially
 * applied.
 */
export async function decodeAndVerify(params: {
  address: Address;
  data: Uint8Array;
  slot: bigint;
  programId: string;
}): Promise<DecodeVerifyResult> {
  let decoded;
  try {
    decoded = decodeTagAccount(params.data);
  } catch (error) {
    return {
      ok: false,
      reason: `decode failed for ${params.address}: ${(error as Error).message}`,
    };
  }

  const [derivedAddress] = await deriveTagPda(decoded.tag, params.programId);
  if (derivedAddress !== params.address) {
    return {
      ok: false,
      reason: `PDA mismatch for tag ${decoded.tag}: account address ${params.address} does not match derived address ${derivedAddress}`,
    };
  }

  return {
    ok: true,
    change: {
      address: params.address,
      tag: decoded.tag,
      owner: decoded.owner,
      wallet: decoded.wallet,
      bump: decoded.bump,
      slot: params.slot,
    },
  };
}
