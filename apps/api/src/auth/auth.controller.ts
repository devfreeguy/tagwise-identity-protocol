import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";

import { AuthService } from "./auth.service.js";
import { ChallengeRequestDto } from "./dto/challenge-request.dto.js";
import { ChallengeResponseDto } from "./dto/challenge-response.dto.js";
import { MeResponseDto } from "./dto/me-response.dto.js";
import { VerifyRequestDto } from "./dto/verify-request.dto.js";
import { VerifyResponseDto } from "./dto/verify-response.dto.js";
import { AuthPubkey } from "./guards/auth-pubkey.decorator.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";

@ApiTags("auth")
@Controller("v1/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("challenge")
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: "Issue a single-use sign-in challenge message for a pubkey" })
  @ApiOkResponse({ type: ChallengeResponseDto })
  async challenge(@Body() body: ChallengeRequestDto): Promise<ChallengeResponseDto> {
    const message = await this.authService.challenge(body.pubkey);
    return { message };
  }

  @Post("verify")
  @ApiOperation({ summary: "Verify a signed challenge message and issue a session token" })
  @ApiOkResponse({ type: VerifyResponseDto })
  async verify(@Body() body: VerifyRequestDto): Promise<VerifyResponseDto> {
    const token = await this.authService.verify(body.pubkey, body.message, body.signature);
    return { token };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the authenticated caller's pubkey" })
  @ApiOkResponse({ type: MeResponseDto })
  me(@AuthPubkey() pubkey: string): MeResponseDto {
    return { pubkey };
  }
}
