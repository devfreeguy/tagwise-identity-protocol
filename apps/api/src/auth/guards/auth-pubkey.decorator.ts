import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { AuthenticatedRequest } from "./jwt-auth.guard.js";

/** Extracts the pubkey JwtAuthGuard attached to the request. */
export const AuthPubkey = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.authPubkey) {
    throw new Error("AuthPubkey decorator used on a route without JwtAuthGuard");
  }
  return request.authPubkey;
});
