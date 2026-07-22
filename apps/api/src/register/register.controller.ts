import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AuthPubkey } from "../auth/guards/auth-pubkey.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import {
  ErrorResponseDto,
  InsufficientBalanceResponseDto,
  TagAlreadyRegisteredErrorDto,
  TagFormatErrorDto,
  TagUnavailableErrorDto,
} from "../common/dto/error-response.dto.js";
import { RegisterRequestDto } from "./dto/register-request.dto.js";
import { RegisterResponseDto } from "./dto/register-response.dto.js";
import { RegisterThrottlerGuard } from "./register-throttler.guard.js";
import { RegisterService } from "./register.service.js";

@ApiTags("Registration")
@Controller("v1")
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post("register")
  // JwtAuthGuard must run first so RegisterThrottlerGuard can key its rate
  // limit on the authenticated pubkey.
  @UseGuards(JwtAuthGuard, RegisterThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Register tag",
    description:
      "Builds an UNSIGNED register_tag transaction for the caller to sign and submit themselves. The server never signs or submits it, and never writes the mirror; the identities row is created only once the indexer observes the transaction land on-chain. The caller (the authenticated pubkey, always the fee payer and owner, never taken from the request body) pays their own account rent and network fee. If wallet is omitted, it defaults to the caller's own pubkey.",
  })
  @ApiOkResponse({ type: RegisterResponseDto })
  @ApiResponse({
    status: 400,
    description: "The tag failed canonical-form validation, or wallet is not a valid base58 Solana address.",
    type: TagFormatErrorDto,
    examples: {
      invalidTag: { summary: "Invalid tag", value: { statusCode: 400, message: "invalid tag: TOO_SHORT", reason: "TOO_SHORT" } },
      invalidWallet: {
        summary: "Invalid wallet",
        value: { statusCode: 400, message: "wallet is not a valid base58 Solana address", reason: "INVALID_WALLET" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token.", type: ErrorResponseDto })
  @ApiResponse({
    status: 402,
    description: "The fee payer cannot cover rent and fees for this registration.",
    type: InsufficientBalanceResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: "The tag is reserved, or fails the profanity filter.",
    type: TagUnavailableErrorDto,
  })
  @ApiResponse({
    status: 409,
    description: "An active tag already exists at this name.",
    type: TagAlreadyRegisteredErrorDto,
  })
  @ApiResponse({ status: 429, description: "Too many registration attempts; rate-limited per pubkey and IP." })
  register(@Body() body: RegisterRequestDto, @AuthPubkey() ownerPubkey: string): Promise<RegisterResponseDto> {
    return this.registerService.register({ rawTag: body.tag, wallet: body.wallet, ownerPubkey });
  }
}
