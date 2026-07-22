const STATEMENT = "Sign in to authenticate with the TIP API. This request will not trigger a blockchain transaction or cost any fees.";

export type SignInMessageFields = Readonly<{
  domain: string;
  pubkey: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}>;

/**
 * Builds a structured, domain-separated, Sign-In-With-Solana style message.
 * Domain separation (the leading domain line) means a signature produced for
 * this API's challenge cannot be replayed against a different site asking
 * for a similarly-shaped signature. Every field a verifier needs is present
 * in human-readable form, since this is exactly the text the wallet shows
 * the user before they sign.
 */
export function buildSignInMessage(fields: SignInMessageFields): string {
  return [
    `${fields.domain} wants you to sign in with your Solana account:`,
    fields.pubkey,
    "",
    STATEMENT,
    "",
    `Nonce: ${fields.nonce}`,
    `Issued At: ${fields.issuedAt}`,
    `Expiration Time: ${fields.expirationTime}`,
  ].join("\n");
}

export type ParsedSignInMessage = Readonly<{
  domain: string;
  pubkey: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}>;

const DOMAIN_LINE_PATTERN = /^(.*) wants you to sign in with your Solana account:$/;
const NONCE_PREFIX = "Nonce: ";
const ISSUED_AT_PREFIX = "Issued At: ";
const EXPIRATION_PREFIX = "Expiration Time: ";

/**
 * Parses a message built by buildSignInMessage back into its fields.
 * Returns null if the message does not match the expected structure at all,
 * rather than partially trusting a malformed or tampered message.
 */
export function parseSignInMessage(message: string): ParsedSignInMessage | null {
  const lines = message.split("\n");

  const domainMatch = lines[0]?.match(DOMAIN_LINE_PATTERN);
  const pubkey = lines[1];
  const nonceLine = lines.find((line) => line.startsWith(NONCE_PREFIX));
  const issuedAtLine = lines.find((line) => line.startsWith(ISSUED_AT_PREFIX));
  const expirationLine = lines.find((line) => line.startsWith(EXPIRATION_PREFIX));

  if (!domainMatch || !pubkey || !nonceLine || !issuedAtLine || !expirationLine) {
    return null;
  }

  const domain = domainMatch[1];
  if (!domain) {
    return null;
  }

  return {
    domain,
    pubkey,
    nonce: nonceLine.slice(NONCE_PREFIX.length),
    issuedAt: issuedAtLine.slice(ISSUED_AT_PREFIX.length),
    expirationTime: expirationLine.slice(EXPIRATION_PREFIX.length),
  };
}
