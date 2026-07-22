import { address, getAddressEncoder, getBase58Encoder, isAddress } from "@solana/kit";
import nacl from "tweetnacl";

const addressEncoder = getAddressEncoder();
const base58Encoder = getBase58Encoder();
const textEncoder = new TextEncoder();

const SIGNATURE_LENGTH_BYTES = 64;

/** Validates that candidate is a real base58 Solana address, via @solana/kit. */
export function isValidSolanaAddress(candidate: string): boolean {
  return isAddress(candidate);
}

/**
 * Verifies an ed25519 signature over message against pubkeyBase58, using
 * tweetnacl: a synchronous, zero-dependency, long-audited implementation
 * that Solana's own JS ecosystem (web3.js) has historically used for this
 * exact operation, so it is the ecosystem-idiomatic choice here.
 *
 * signatureBase58 must be the base58 encoding of the raw 64-byte ed25519
 * signature. Returns false (never throws) for any malformed input.
 */
export function verifySignature(message: string, signatureBase58: string, pubkeyBase58: string): boolean {
  if (!isAddress(pubkeyBase58)) {
    return false;
  }

  let pubkeyBytes: Uint8Array;
  let signatureBytes: Uint8Array;
  try {
    // tweetnacl requires plain mutable Uint8Array; the Kit encoders return a
    // distinct ReadonlyUint8Array type, so copy rather than cast.
    pubkeyBytes = Uint8Array.from(addressEncoder.encode(address(pubkeyBase58)));
    signatureBytes = Uint8Array.from(base58Encoder.encode(signatureBase58));
  } catch {
    return false;
  }

  if (signatureBytes.length !== SIGNATURE_LENGTH_BYTES) {
    return false;
  }

  const messageBytes = textEncoder.encode(message);
  return nacl.sign.detached.verify(messageBytes, signatureBytes, pubkeyBytes);
}
