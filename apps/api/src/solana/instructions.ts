import { addEncoderSizePrefix, getAddressEncoder, getU32Encoder, getUtf8Encoder, type Address } from "@solana/kit";

// Both discriminators are read directly from
// programs/tip-registry/target/idl/tip_registry.json, never guessed.
export const REGISTER_TAG_DISCRIMINATOR = Uint8Array.from([74, 29, 15, 99, 244, 166, 160, 42]);
export const UPDATE_WALLET_DISCRIMINATOR = Uint8Array.from([30, 233, 126, 238, 58, 16, 215, 184]);

const addressEncoder = getAddressEncoder();

export function encodeRegisterTagInstructionData(tag: string): Uint8Array {
  const tagEncoder = addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder());
  const tagBytes = tagEncoder.encode(tag);
  const data = new Uint8Array(REGISTER_TAG_DISCRIMINATOR.length + tagBytes.length);
  data.set(REGISTER_TAG_DISCRIMINATOR, 0);
  data.set(tagBytes, REGISTER_TAG_DISCRIMINATOR.length);
  return data;
}

export function encodeUpdateWalletInstructionData(newWallet: Address): Uint8Array {
  const walletBytes = addressEncoder.encode(newWallet);
  const data = new Uint8Array(UPDATE_WALLET_DISCRIMINATOR.length + walletBytes.length);
  data.set(UPDATE_WALLET_DISCRIMINATOR, 0);
  data.set(walletBytes, UPDATE_WALLET_DISCRIMINATOR.length);
  return data;
}
