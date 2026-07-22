import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AuthPubkey } from "../auth/guards/auth-pubkey.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { TagOwnershipGuard } from "../auth/guards/tag-ownership.guard.js";
import { AvailabilityResponseDto } from "./dto/availability-response.dto.js";
import { IdentityResponseDto } from "./dto/identity-response.dto.js";
import { PaymentLinkResponseDto } from "./dto/payment-link-response.dto.js";
import { QrResponseDto } from "./dto/qr-response.dto.js";
import { ResolveResponseDto } from "./dto/resolve-response.dto.js";
import { SearchResultItemDto } from "./dto/search-result.dto.js";
import { UpdateIdentityRequestDto } from "./dto/update-identity-request.dto.js";
import { UpdateWalletRequestDto } from "./dto/update-wallet-request.dto.js";
import { UpdateWalletResponseDto } from "./dto/update-wallet-response.dto.js";
import { IdentityUpdateThrottlerGuard } from "./identity-update-throttler.guard.js";
import { normalizeTagParamOrThrow } from "./tag-param.js";
import { TagsService } from "./tags.service.js";
import { WalletUpdateService } from "./wallet-update.service.js";

// Loosely typed to avoid a phantom fastify dependency, matching the
// MinimalResponse pattern in global-exception.filter.ts. Only body is read,
// and only to distinguish "key omitted" from "key present with value null"
// ahead of DTO validation/transformation, which class-validator's
// whitelist/transform pipeline does not preserve reliably on its own.
type MinimalRequest = { body: Record<string, unknown> };

const EDITABLE_FIELDS = ["displayName", "avatar", "bio", "preferredToken"] as const;

@ApiTags("tags")
@Controller("v1")
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly walletUpdateService: WalletUpdateService,
  ) {}

  @Get("resolve/:tag")
  @ApiOperation({ summary: "Resolve a tag to its payment details" })
  @ApiOkResponse({ type: ResolveResponseDto })
  resolve(@Param("tag") rawTag: string): Promise<ResolveResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.resolve(tag);
  }

  @Get("identity/:tag")
  @ApiOperation({ summary: "Fetch the public identity object for a tag" })
  @ApiOkResponse({ type: IdentityResponseDto })
  identity(@Param("tag") rawTag: string): Promise<IdentityResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.identity(tag);
  }

  @Get("availability/:tag")
  @ApiOperation({ summary: "Check whether a tag is available to register" })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  availability(@Param("tag") rawTag: string): Promise<AvailabilityResponseDto> {
    // Unlike the other endpoints, availability does not 400 on non-canonical
    // input; it runs the full naming gate itself and reports reason:
    // "invalid" as a normal answer, since the whole point of this endpoint
    // is to report on validity, not to assume it.
    return this.tagsService.availability(rawTag);
  }

  @Get("search")
  @ApiOperation({ summary: "Search active tags by prefix or display name" })
  @ApiOkResponse({ type: [SearchResultItemDto] })
  search(@Query("q") query?: string): Promise<SearchResultItemDto[]> {
    return this.tagsService.search(query ?? "");
  }

  @Get("qr/:tag")
  @ApiOperation({ summary: "Fetch the QR payload data for a tag (data only, never an image)" })
  @ApiOkResponse({ type: QrResponseDto })
  qr(@Param("tag") rawTag: string): Promise<QrResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.qr(tag);
  }

  @Get("payment-link/:tag")
  @ApiOperation({ summary: "Fetch the payment link metadata for a tag" })
  @ApiOkResponse({ type: PaymentLinkResponseDto })
  paymentLink(@Param("tag") rawTag: string): Promise<PaymentLinkResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.paymentLink(tag);
  }

  @Patch("identity/:tag")
  // JwtAuthGuard must run first so TagOwnershipGuard and the throttler can
  // read authPubkey off the request; TagOwnershipGuard must run before the
  // handler so a non-owner never reaches it (403) and a missing/blocked tag
  // never does either (404).
  @UseGuards(JwtAuthGuard, TagOwnershipGuard, IdentityUpdateThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Partially update the caller's own profile (displayName, avatar, bio, preferredToken)" })
  @ApiOkResponse({ type: IdentityResponseDto })
  updateIdentity(
    @Param("tag") rawTag: string,
    @Body() body: UpdateIdentityRequestDto,
    @Req() request: MinimalRequest,
    @AuthPubkey() ownerPubkey: string,
  ): Promise<IdentityResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    const provided = Object.fromEntries(
      EDITABLE_FIELDS.map((field) => [field, Object.prototype.hasOwnProperty.call(request.body, field)]),
    ) as Record<(typeof EDITABLE_FIELDS)[number], boolean>;

    return this.tagsService.updateIdentity({ tag, ownerPubkey, dto: body, provided });
  }

  @Post("identity/:tag/wallet")
  // Changing the payment wallet is an on-chain operation: this only builds
  // and returns an unsigned update_wallet transaction, exactly like
  // POST /v1/register does for registration. It never writes the mirror;
  // the wallet column changes only once the indexer observes the
  // instruction land on-chain.
  @UseGuards(JwtAuthGuard, TagOwnershipGuard, IdentityUpdateThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Build an unsigned update_wallet transaction for the caller to sign and submit themselves" })
  @ApiOkResponse({ type: UpdateWalletResponseDto })
  updateWallet(
    @Param("tag") rawTag: string,
    @Body() body: UpdateWalletRequestDto,
    @AuthPubkey() ownerPubkey: string,
  ): Promise<UpdateWalletResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.walletUpdateService.buildTransaction({ tag, ownerPubkey, newWallet: body.wallet });
  }
}
