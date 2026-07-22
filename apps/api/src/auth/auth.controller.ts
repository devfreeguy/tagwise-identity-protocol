import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";

import { ErrorResponseDto } from "../common/dto/error-response.dto.js";
import { AuthService } from "./auth.service.js";
import { ChallengeRequestDto } from "./dto/challenge-request.dto.js";
import { ChallengeResponseDto } from "./dto/challenge-response.dto.js";
import { MeResponseDto } from "./dto/me-response.dto.js";
import { VerifyRequestDto } from "./dto/verify-request.dto.js";
import { VerifyResponseDto } from "./dto/verify-response.dto.js";
import { AuthPubkey } from "./guards/auth-pubkey.decorator.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";

@ApiTags("Auth")
@Controller("v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("challenge")
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: "Request challenge",
    description:
      "Issues a single-use, domain-separated sign-in message for pubkey and stores its nonce, ready for the caller's wallet to sign. The nonce is consumed the moment it is verified (or found invalid), so a captured challenge/signature pair can never be replayed to obtain a second session.",
  })
  @ApiOkResponse({ type: ChallengeResponseDto })
  @ApiResponse({ status: 400, description: "pubkey is not a valid base58 Solana address.", type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: "Too many challenge requests." })
  async challenge(@Body() body: ChallengeRequestDto): Promise<ChallengeResponseDto> {
    const message = await this.authService.challenge(body.pubkey);
    return { message };
  }

  @Post("verify")
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: "Verify signature",
    description:
      "Verifies a signed challenge message and, if valid, issues a session JWT. The nonce embedded in the message is consumed atomically on this call: a second verify attempt with the same signed message fails even if the signature is still mathematically valid, closing off replay. Every failure path (malformed message, pubkey mismatch, expired message, already-used nonce, bad signature) returns the same 401 with no indication of which check failed. Rate-limited with the same policy as /v1/auth/challenge: without this, an attacker could force unlimited ed25519 verifications, a CPU-bound denial-of-service vector.",
  })
  @ApiOkResponse({ type: VerifyResponseDto })
  @ApiResponse({ status: 400, description: "Request body failed validation (see message for the offending field)." })
  @ApiResponse({
    status: 401,
    description: "The message, nonce, or signature failed verification.",
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 429, description: "Too many verification attempts." })
  async verify(@Body() body: VerifyRequestDto): Promise<VerifyResponseDto> {
    const token = await this.authService.verify(body.pubkey, body.message, body.signature);
    return { token };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get session",
    description: "Returns the pubkey the connected bearer token authenticates as.",
  })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token.", type: ErrorResponseDto })
  me(@AuthPubkey() pubkey: string): MeResponseDto {
    return { pubkey };
  }
}
