import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AvailabilityResponseDto } from "./dto/availability-response.dto.js";
import { IdentityResponseDto } from "./dto/identity-response.dto.js";
import { PaymentLinkResponseDto } from "./dto/payment-link-response.dto.js";
import { QrResponseDto } from "./dto/qr-response.dto.js";
import { ResolveResponseDto } from "./dto/resolve-response.dto.js";
import { SearchResultItemDto } from "./dto/search-result.dto.js";
import { normalizeTagParamOrThrow } from "./tag-param.js";
import { TagsService } from "./tags.service.js";

@ApiTags("tags")
@Controller("v1")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

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
}
