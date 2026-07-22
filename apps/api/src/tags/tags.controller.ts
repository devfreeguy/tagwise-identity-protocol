import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AuthPubkey } from "../auth/guards/auth-pubkey.decorator.js";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard.js";
import { TagOwnershipGuard } from "../auth/guards/tag-ownership.guard.js";
import { ContentBlockedErrorDto, ErrorResponseDto, TagFormatErrorDto } from "../common/dto/error-response.dto.js";
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

@Controller("v1")
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly walletUpdateService: WalletUpdateService,
  ) {}

  @Get("resolve/:tag")
  @ApiTags("Tags")
  @ApiOperation({
    summary: "Resolve tag",
    description:
      "Looks up a tag's payment details: the Redis cache first, then the Postgres mirror, then the Solana chain as a last-resort fallback if the mirror is missing a tag the chain actually has. A blocked tag (moderation status, not deleted) answers the same 404 as a tag that was never registered; the API never reveals that a blocked row exists.",
  })
  @ApiOkResponse({ type: ResolveResponseDto })
  @ApiResponse({ status: 400, description: "The tag failed canonical-form validation.", type: TagFormatErrorDto })
  @ApiResponse({ status: 404, description: "No active tag exists at this name.", type: ErrorResponseDto })
  resolve(@Param("tag") rawTag: string): Promise<ResolveResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.resolve(tag);
  }

  @Get("identity/:tag")
  @ApiTags("Tags")
  @ApiOperation({
    summary: "Get identity",
    description:
      "Returns the full public identity object for an active tag, including bio and owner, fields resolve() omits. A blocked or missing tag both answer 404, indistinguishably.",
  })
  @ApiOkResponse({ type: IdentityResponseDto })
  @ApiResponse({ status: 400, description: "The tag failed canonical-form validation.", type: TagFormatErrorDto })
  @ApiResponse({ status: 404, description: "No active tag exists at this name.", type: ErrorResponseDto })
  identity(@Param("tag") rawTag: string): Promise<IdentityResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.identity(tag);
  }

  @Get("availability/:tag")
  @ApiTags("Tags")
  @ApiOperation({
    summary: "Check availability",
    description:
      "Answers whether a tag can be registered right now. Unlike the other tag endpoints, malformed input is not a 400 here: this endpoint's whole purpose is to report on a tag's status, so \"no, it's not even valid\" is a normal 200 answer (reason: invalid), not an error. The other reasons a tag can be unavailable are reserved (on the protocol's reserved list), inappropriate (fails the profanity filter), and already_registered (an active row already exists).",
  })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  availability(@Param("tag") rawTag: string): Promise<AvailabilityResponseDto> {
    // Unlike the other endpoints, availability does not 400 on non-canonical
    // input; it runs the full naming gate itself and reports reason:
    // "invalid" as a normal answer, since the whole point of this endpoint
    // is to report on validity, not to assume it.
    return this.tagsService.availability(rawTag);
  }

  @Get("search")
  @ApiTags("Tags")
  @ApiOperation({
    summary: "Search tags",
    description:
      "Ranked search over active tags only, matching by tag prefix or display name (exact match first, then prefix), up to 10 results. An empty or missing query returns an empty list, never an error.",
  })
  @ApiOkResponse({ type: [SearchResultItemDto] })
  search(@Query("q") query?: string): Promise<SearchResultItemDto[]> {
    return this.tagsService.search(query ?? "");
  }

  @Get("qr/:tag")
  @ApiTags("Tags")
  @ApiOperation({
    summary: "Get QR payload",
    description:
      "Returns the QR payload DATA for a tag: the wallet address and payment link, never an image. Rendering the QR code itself (as an image) is the client's responsibility.",
  })
  @ApiOkResponse({ type: QrResponseDto })
  @ApiResponse({ status: 400, description: "The tag failed canonical-form validation.", type: TagFormatErrorDto })
  @ApiResponse({ status: 404, description: "No active tag exists at this name.", type: ErrorResponseDto })
  qr(@Param("tag") rawTag: string): Promise<QrResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.qr(tag);
  }

  @Get("payment-link/:tag")
  @ApiTags("Tags")
  @ApiOperation({
    summary: "Get payment link",
    description: "Returns the public payment link and wallet address for an active tag.",
  })
  @ApiOkResponse({ type: PaymentLinkResponseDto })
  @ApiResponse({ status: 400, description: "The tag failed canonical-form validation.", type: TagFormatErrorDto })
  @ApiResponse({ status: 404, description: "No active tag exists at this name.", type: ErrorResponseDto })
  paymentLink(@Param("tag") rawTag: string): Promise<PaymentLinkResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.tagsService.paymentLink(tag);
  }

  @Patch("identity/:tag")
  @ApiTags("Profile")
  // JwtAuthGuard must run first so TagOwnershipGuard and the throttler can
  // read authPubkey off the request; TagOwnershipGuard must run before the
  // handler so a non-owner never reaches it (403) and a missing/blocked tag
  // never does either (404).
  @UseGuards(JwtAuthGuard, TagOwnershipGuard, IdentityUpdateThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update profile",
    description:
      "Patches the caller's own off-chain profile fields: displayName, avatar, bio, preferredToken. Only tag, owner, wallet, and moderation flags (verified, merchant) are excluded, those are not editable through this endpoint at all. A key omitted from the request body leaves that column untouched; a key present with value null clears it. TagOwnershipGuard validates the tag format before the handler runs (400 on malformed input) and then checks existence and ownership (404 for a missing or blocked tag, 403 for a real tag owned by someone else).",
  })
  @ApiOkResponse({ type: IdentityResponseDto })
  @ApiResponse({
    status: 400,
    description: "The tag failed canonical-form validation, or the request body failed validation.",
    type: TagFormatErrorDto,
  })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token.", type: ErrorResponseDto })
  @ApiResponse({
    status: 403,
    description: "The caller does not own this tag, or displayName/bio failed the profanity filter.",
    type: ContentBlockedErrorDto,
  })
  @ApiResponse({ status: 404, description: "The tag does not exist or is blocked.", type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: "Too many profile updates; rate-limited per authenticated pubkey." })
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
  @ApiTags("Profile")
  // Changing the payment wallet is an on-chain operation: this only builds
  // and returns an unsigned update_wallet transaction, exactly like
  // POST /v1/register does for registration. It never writes the mirror;
  // the wallet column changes only once the indexer observes the
  // instruction land on-chain.
  @UseGuards(JwtAuthGuard, TagOwnershipGuard, IdentityUpdateThrottlerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update wallet",
    description:
      "Builds an UNSIGNED update_wallet transaction for the caller to sign and submit themselves; the server never signs it. The mirror's wallet column does not change from this call, it changes only once the indexer observes the update_wallet instruction land on-chain. Changing the wallet never changes the tag's owner. TagOwnershipGuard validates the tag format before the handler runs (400 on malformed input) and then checks existence and ownership (404 for a missing or blocked tag, 403 for a real tag owned by someone else).",
  })
  @ApiOkResponse({ type: UpdateWalletResponseDto })
  @ApiResponse({
    status: 400,
    description: "The tag failed canonical-form validation, or the new wallet is not a valid base58 Solana address.",
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
  @ApiResponse({ status: 403, description: "The caller does not own this tag.", type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: "The tag does not exist or is blocked.", type: ErrorResponseDto })
  @ApiResponse({ status: 429, description: "Too many wallet updates; rate-limited per authenticated pubkey." })
  updateWallet(
    @Param("tag") rawTag: string,
    @Body() body: UpdateWalletRequestDto,
    @AuthPubkey() ownerPubkey: string,
  ): Promise<UpdateWalletResponseDto> {
    const tag = normalizeTagParamOrThrow(rawTag);
    return this.walletUpdateService.buildTransaction({ tag, ownerPubkey, newWallet: body.wallet });
  }
}
