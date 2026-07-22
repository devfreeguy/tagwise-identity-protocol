import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Rate-limits POST /v1/register per authenticated pubkey AND per IP, by
 * combining both into a single tracker key: abuse from one pubkey behind
 * rotating IPs, or many pubkeys behind one IP, both count against the same
 * limit. Must run after JwtAuthGuard in the guard chain so authPubkey is
 * already set on the request.
 *
 * The real deterrent here is that users pay their own rent and fees; this
 * throttle only blunts spam attempts, it is not the primary defense. This
 * is in-memory only, like the rest of the throttler this stage; a
 * Redis-backed store lands in stage 2.
 */
@Injectable()
export class RegisterThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown> & { authPubkey?: string; ip?: string }): Promise<string> {
    const ip = req.ip ?? "unknown-ip";
    const pubkey = req.authPubkey ?? "unauthenticated";
    return `${ip}:${pubkey}`;
  }
}
