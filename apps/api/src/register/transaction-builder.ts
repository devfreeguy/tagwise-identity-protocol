import {
  address,
  addEncoderSizePrefix,
  appendTransactionMessageInstructions,
  compileTransaction,
  createTransactionMessage,
  getAddressEncoder,
  getU32Encoder,
  getUtf8Encoder,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  AccountRole,
  type Address,
  type Blockhash,
  type Instruction,
  type Transaction,
} from "@solana/kit";
import { deriveTagPda, type NormalizedTag } from "@tip/core";

// Both discriminators are read directly from
// programs/tip-registry/target/idl/tip_registry.json, never guessed.
const REGISTER_TAG_DISCRIMINATOR = Uint8Array.from([74, 29, 15, 99, 244, 166, 160, 42]);
const UPDATE_WALLET_DISCRIMINATOR = Uint8Array.from([30, 233, 126, 238, 58, 16, 215, 184]);

const SYSTEM_PROGRAM_ADDRESS = address("11111111111111111111111111111111");

const addressEncoder = getAddressEncoder();

function encodeRegisterTagInstructionData(tag: string): Uint8Array {
  const tagEncoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
  const tagBytes = tagEncoder.encode(tag);
  const data = new Uint8Array(REGISTER_TAG_DISCRIMINATOR.length + tagBytes.length);
  data.set(REGISTER_TAG_DISCRIMINATOR, 0);
  data.set(tagBytes, REGISTER_TAG_DISCRIMINATOR.length);
  return data;
}

function encodeUpdateWalletInstructionData(newWallet: Address): Uint8Array {
  const walletBytes = addressEncoder.encode(newWallet);
  const data = new Uint8Array(UPDATE_WALLET_DISCRIMINATOR.length + walletBytes.length);
  data.set(UPDATE_WALLET_DISCRIMINATOR, 0);
  data.set(walletBytes, UPDATE_WALLET_DISCRIMINATOR.length);
  return data;
}

export type BuiltRegisterTransaction = Readonly<{
  transaction: Transaction;
  pda: Address;
}>;

/**
 * Builds the unsigned transaction to register a tag. The fee payer is the
 * authenticated pubkey (the owner), who signs and submits it themselves.
 * The server never signs and never holds a keypair; this only compiles the
 * transaction bytes.
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
 * Account order for register_tag matches the IDL exactly: tag_account (the
 * PDA, writable), owner (writable signer, the fee payer), system_program.
 * Account order for update_wallet: tag_account (writable), owner (signer).
 */
export async function buildRegisterTagTransaction(params: {
  programId: string;
  tag: NormalizedTag;
  ownerPubkey: string;
  walletAddress: string;
  blockhash: Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>;
}): Promise<BuiltRegisterTransaction> {
  const [pda] = await deriveTagPda(params.tag, params.programId);
  const ownerAddress = address(params.ownerPubkey);
  const programAddress = address(params.programId);

  const registerInstruction: Instruction = {
    programAddress,
    accounts: [
      { address: pda, role: AccountRole.WRITABLE },
      { address: ownerAddress, role: AccountRole.WRITABLE_SIGNER },
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
      setTransactionMessageFeePayer(ownerAddress, createTransactionMessage({ version: 0 })),
    ),
  );

  const transaction = compileTransaction(message);

  return { transaction, pda };
}
