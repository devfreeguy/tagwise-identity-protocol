import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AuthPubkey } from "../auth/guards/auth-pubkey.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { RegisterRequestDto } from "./dto/register-request.dto.js";
import { RegisterResponseDto } from "./dto/register-response.dto.js";
import { RegisterThrottlerGuard } from "./register-throttler.guard.js";
import { RegisterService } from "./register.service.js";

@ApiTags("register")
@Controller("v1")
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post("register")
  // JwtAuthGuard must run first so RegisterThrottlerGuard can key its rate
  // limit on the authenticated pubkey.
  @UseGuards(JwtAuthGuard, RegisterThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Build an unsigned register_tag transaction for the caller to sign and submit themselves",
  })
  @ApiOkResponse({ type: RegisterResponseDto })
  register(@Body() body: RegisterRequestDto, @AuthPubkey() ownerPubkey: string): Promise<RegisterResponseDto> {
    return this.registerService.register({ rawTag: body.tag, wallet: body.wallet, ownerPubkey });
  }
}
