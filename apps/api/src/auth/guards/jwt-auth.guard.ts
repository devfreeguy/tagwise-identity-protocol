import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ConfigService } from "../../config/config.service.js";

export type AuthenticatedRequest = {
  authPubkey?: string;
  headers: Record<string, string | string[] | undefined>;
};

const BEARER_PREFIX = "Bearer ";

/**
 * Validates the Bearer token, attaches the authenticated pubkey to the
 * request (as authPubkey), and rejects missing, malformed, or expired
 * tokens with 401. Reusable by any later stage that needs "is this caller
 * logged in".
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token =
      typeof header === "string" && header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : undefined;

    if (!token) {
      throw new UnauthorizedException("missing bearer token");
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.config.jwtSecret,
      });
      request.authPubkey = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("invalid or expired token");
    }
  }
}
