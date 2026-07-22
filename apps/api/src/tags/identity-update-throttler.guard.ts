import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Rate-limits PATCH /v1/identity/:tag per authenticated pubkey only, unlike
 * RegisterThrottlerGuard which also mixes in IP. Must run after
 * JwtAuthGuard in the guard chain so authPubkey is already set on the
 * request. In-memory only, like the rest of the throttler this stage; a
 * Redis-backed store lands in stage 2.
 */
@Injectable()
export class IdentityUpdateThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown> & { authPubkey?: string }): Promise<string> {
    return req.authPubkey ?? "unauthenticated";
  }
}
