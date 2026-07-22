import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  AccountRole,
  type Address,
  type Blockhash,
  type Instruction,
  type Transaction,
} from "@solana/kit";
import { deriveTagPda, type NormalizedTag } from "@tip/core";

import { encodeUpdateWalletInstructionData } from "../solana/instructions.js";

export type BuiltWalletUpdateTransaction = Readonly<{
  transaction: Transaction;
  pda: Address;
}>;

/**
 * Builds the unsigned transaction to change a tag's payment wallet, using
 * only the deployed update_wallet instruction (no register_tag). The fee
 * payer is the authenticated owner, who signs and submits it themselves;
 * the server never signs and never holds a keypair.
 *
 * Account order matches the IDL exactly: tag_account (the PDA, writable),
 * owner (signer, not writable; owner pays no rent here, only the tx fee,
 * which is charged to the fee payer regardless of its account role).
 *
 * Unlike register_tag, update_wallet touches an already rent-exempt
 * account, so there is no rent-exemption cost to check here, only the
 * ordinary per-signature transaction fee.
 */
export async function buildUpdateWalletTransaction(params: {
  programId: string;
  tag: NormalizedTag;
  ownerPubkey: string;
  newWallet: string;
  blockhash: Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>;
}): Promise<BuiltWalletUpdateTransaction> {
  const [pda] = await deriveTagPda(params.tag, params.programId);
  const ownerAddress = address(params.ownerPubkey);
  const newWalletAddress = address(params.newWallet);
  const programAddress = address(params.programId);

  const instruction: Instruction = {
    programAddress,
    accounts: [
      { address: pda, role: AccountRole.WRITABLE },
      { address: ownerAddress, role: AccountRole.READONLY_SIGNER },
    ],
    data: encodeUpdateWalletInstructionData(newWalletAddress),
  };

  const message = appendTransactionMessageInstructions(
    [instruction],
    setTransactionMessageLifetimeUsingBlockhash(
      params.blockhash,
      setTransactionMessageFeePayer(ownerAddress, createTransactionMessage({ version: 0 })),
    ),
  );

  const transaction = compileTransaction(message);

  return { transaction, pda };
}
