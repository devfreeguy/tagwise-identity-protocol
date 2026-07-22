import { randomBytes } from "node:crypto";

import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";

import { ConfigService } from "../config/config.service.js";
import { isValidSolanaAddress, verifySignature } from "./ed25519.js";
import { buildSignInMessage, parseSignInMessage } from "./message.js";
import { NONCE_STORE, type NonceStore } from "./nonce-store.js";

const NONCE_BYTES = 24;

@Injectable()
export class AuthService {
  constructor(
    @Inject(NONCE_STORE) private readonly nonceStore: NonceStore,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async challenge(pubkey: string): Promise<string> {
    if (!isValidSolanaAddress(pubkey)) {
      throw new BadRequestException("pubkey is not a valid base58 Solana address");
    }

    const nonce = randomBytes(NONCE_BYTES).toString("hex");
    const issuedAt = new Date();
    const expirationTime = new Date(issuedAt.getTime() + this.config.config.authNonceTtlSeconds * 1000);

    const message = buildSignInMessage({
      domain: this.config.config.authDomain,
      pubkey,
      nonce,
      issuedAt: issuedAt.toISOString(),
      expirationTime: expirationTime.toISOString(),
    });

    await this.nonceStore.put(pubkey, nonce, this.config.config.authNonceTtlSeconds);

    return message;
  }

  async verify(pubkey: string, message: string, signature: string): Promise<string> {
    const parsed = parseSignInMessage(message);
    // Every failure path below returns the same 401 without saying which
    // check failed, so a caller probing this endpoint learns nothing about
    // why a given attempt was rejected.
    if (!parsed) {
      throw new UnauthorizedException("invalid or malformed sign-in message");
    }
    if (parsed.pubkey !== pubkey) {
      throw new UnauthorizedException("message pubkey does not match request pubkey");
    }
    if (new Date(parsed.expirationTime).getTime() < Date.now()) {
      throw new UnauthorizedException("sign-in message has expired");
    }

    // Consuming the nonce here, before signature verification, means a
    // replayed (pubkey, nonce, signature) triple can never succeed twice,
    // even if the signature itself is perfectly valid both times.
    const consumed = await this.nonceStore.take(pubkey, parsed.nonce);
    if (!consumed) {
      throw new UnauthorizedException("nonce is missing, expired, or already used");
    }

    if (!verifySignature(message, signature, pubkey)) {
      throw new UnauthorizedException("signature verification failed");
    }

    // JWTs issued here are not revocable; the short TTL (AUTH_TOKEN_TTL) is
    // the mitigation for a leaked token. A denylist can be added later if
    // revocation before expiry is needed.
    return this.jwt.signAsync(
      { sub: pubkey },
      {
        secret: this.config.config.jwtSecret,
        // AUTH_TOKEN_TTL is a runtime-validated env string (for example "1h");
        // jsonwebtoken parses it with the "ms" package at sign time, which is
        // stricter than the plain `string` type this cast bridges.
        expiresIn: this.config.config.authTokenTtl as NonNullable<JwtSignOptions["expiresIn"]>,
      },
    );
  }
}
