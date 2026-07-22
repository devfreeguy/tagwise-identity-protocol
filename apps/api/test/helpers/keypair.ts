import { getBase58Decoder } from "@solana/kit";
import nacl from "tweetnacl";

const base58Decoder = getBase58Decoder();
const textEncoder = new TextEncoder();

export type TestKeypair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  pubkeyBase58: string;
};

/** Generates a real ed25519 keypair so tests exercise the full crypto path. */
export function generateTestKeypair(): TestKeypair {
  const keyPair = nacl.sign.keyPair();
  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
    pubkeyBase58: base58Decoder.decode(keyPair.publicKey),
  };
}

/** Signs message with secretKey and returns the base58-encoded signature. */
export function signMessage(message: string, secretKey: Uint8Array): string {
  const signature = nacl.sign.detached(textEncoder.encode(message), secretKey);
  return base58Decoder.decode(signature);
}
