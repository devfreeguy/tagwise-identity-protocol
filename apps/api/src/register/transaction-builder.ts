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

import { encodeRegisterTagInstructionData, encodeUpdateWalletInstructionData } from "../solana/instructions.js";

const SYSTEM_PROGRAM_ADDRESS = address("11111111111111111111111111111111");

export type BuiltRegisterTransaction = Readonly<{
  transaction: Transaction;
  pda: Address;
}>;

/**
 * Builds the unsigned transaction to register a tag. The fee payer is
 * whichever pubkey funds rent and network fees for this registration:
 * the authenticated owner for a self-paid registration, or a distinct
 * sponsor for one it is paying on the owner's behalf. The server never
 * signs and never holds a keypair; this only compiles the transaction
 * bytes.
 *
 * The deployed register_tag instruction has no wallet parameter at all: it
 * unconditionally sets the on-chain wallet field to the owner (see
 * programs/tip-registry's register_tag.rs). To still honor "wallet may
 * differ from the owner" using only the real, deployed instructions, this
 * appends the program's existing update_wallet instruction to the same
 * transaction whenever the requested wallet differs from the owner, so both
 * land atomically: the tag is registered and its wallet corrected in one
 * signature, one submission.
 *
 * Account order for register_tag matches the on-chain accounts struct
 * exactly: tag_account (the PDA, writable), owner (signer, recorded as the
 * tag's owner, never debited), payer (writable signer, funds rent and
 * fees), system_program. When payerPubkey equals ownerPubkey, one signature
 * satisfies both accounts; when they differ, both must sign, and payer is
 * also the transaction's fee payer. Account order for update_wallet:
 * tag_account (writable), owner (signer).
 */
export async function buildRegisterTagTransaction(params: {
  programId: string;
  tag: NormalizedTag;
  ownerPubkey: string;
  payerPubkey: string;
  walletAddress: string;
  blockhash: Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>;
}): Promise<BuiltRegisterTransaction> {
  const [pda] = await deriveTagPda(params.tag, params.programId);
  const ownerAddress = address(params.ownerPubkey);
  const payerAddress = address(params.payerPubkey);
  const programAddress = address(params.programId);

  const registerInstruction: Instruction = {
    programAddress,
    accounts: [
      { address: pda, role: AccountRole.WRITABLE },
      { address: ownerAddress, role: AccountRole.READONLY_SIGNER },
      { address: payerAddress, role: AccountRole.WRITABLE_SIGNER },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    ],
    data: encodeRegisterTagInstructionData(params.tag),
  };

  const instructions: Instruction[] = [registerInstruction];

  if (params.walletAddress !== params.ownerPubkey) {
    const walletAddress = address(params.walletAddress);
    instructions.push({
      programAddress,
      accounts: [
        { address: pda, role: AccountRole.WRITABLE },
        { address: ownerAddress, role: AccountRole.READONLY_SIGNER },
      ],
      data: encodeUpdateWalletInstructionData(walletAddress),
    });
  }

  const message = appendTransactionMessageInstructions(
    instructions,
    setTransactionMessageLifetimeUsingBlockhash(
      params.blockhash,
      setTransactionMessageFeePayer(payerAddress, createTransactionMessage({ version: 0 })),
    ),
  );

  const transaction = compileTransaction(message);

  return { transaction, pda };
}
