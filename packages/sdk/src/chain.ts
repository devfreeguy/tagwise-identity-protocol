import { createSolanaRpc } from "@solana/kit";
import { decodeTagAccount, deriveTagPda, type NormalizedTag } from "@tip/core";

import type { OnChainIdentity } from "./types.js";

/**
 * The @solana/kit RPC client shape this module needs. Exported so
 * TipClient can accept one as a constructor override (mainly for tests: a
 * plain object satisfying this shape is much simpler and more reliable to
 * inject than mocking the @solana/kit module itself).
 */
export type SolanaRpc = ReturnType<typeof createSolanaRpc>;

export function createRpc(rpcUrl: string): SolanaRpc {
  return createSolanaRpc(rpcUrl);
}

/**
 * Derives the tag PDA, fetches the account over RPC at finalized
 * commitment, and decodes it. Returns null if the account does not exist
 * or fails to decode as a valid tip_registry TagAccount, rather than
 * throwing: a cold-path lookup answering "not found" is a normal, expected
 * outcome, not an error.
 */
export async function resolveOnChainAccount(
  rpc: SolanaRpc,
  tag: NormalizedTag,
  programId: string,
): Promise<OnChainIdentity | null> {
  const [pda] = await deriveTagPda(tag, programId);

  const response = await rpc.getAccountInfo(pda, { commitment: "finalized", encoding: "base64" }).send();
  const accountInfo = response.value;
  if (!accountInfo) {
    return null;
  }

  let decoded;
  try {
    const raw = base64ToBytes(accountInfo.data[0]);
    decoded = decodeTagAccount(raw);
  } catch {
    return null;
  }

  return {
    tag: decoded.tag,
    owner: decoded.owner,
    wallet: decoded.wallet,
    bump: decoded.bump,
    displayName: null,
    avatar: null,
    bio: null,
    preferredToken: null,
    verified: false,
    merchant: false,
  };
}

// Kept local and tiny rather than pulling in a base64 dependency: atob is
// available in every browser and in Node 16+, so this needs no Buffer and
// no extra package.
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
