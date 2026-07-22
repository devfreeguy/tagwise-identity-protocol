import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { normalizeTag, type NormalizedTag } from "@tip/core";
import type { Identity, PrismaClient } from "@tip/db";

import { ConfigService } from "../config/config.service.js";
import { DB_CLIENT } from "../db/db.module.js";
import { CACHE_READER, type CacheReader } from "./cache-reader.js";
import { CHAIN_FALLBACK, type ChainFallback } from "./chain-fallback.js";
import type { AvailabilityResponseDto } from "./dto/availability-response.dto.js";
import type { IdentityResponseDto } from "./dto/identity-response.dto.js";
import type { PaymentLinkResponseDto } from "./dto/payment-link-response.dto.js";
import type { QrResponseDto } from "./dto/qr-response.dto.js";
import type { ResolveResponseDto } from "./dto/resolve-response.dto.js";
import type { SearchResultItemDto } from "./dto/search-result.dto.js";
import { buildPaymentLink, buildProfileLink, buildQrLink } from "./links.js";
import { checkNamingGate } from "./naming-gate.js";
import { presentTag } from "./tag-param.js";

const SEARCH_RESULT_LIMIT = 10;
const SEARCH_OVER_FETCH_LIMIT = 50;

function rankOf(row: { tag: string; displayName: string | null }, query: string): number {
  if (row.tag === query) {
    return 0;
  }
  if (row.tag.startsWith(query)) {
    return 1;
  }
  const displayName = row.displayName?.toLowerCase() ?? "";
  if (displayName === query) {
    return 2;
  }
  if (displayName.startsWith(query)) {
    return 3;
  }
  return 4;
}

@Injectable()
export class TagsService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PrismaClient,
    @Inject(CACHE_READER) private readonly cache: CacheReader,
    @Inject(CHAIN_FALLBACK) private readonly chainFallback: ChainFallback<Identity>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Blocked tags are invisible to the public API: any row whose status is
   * not "active" is treated as if it does not exist.
   */
  private async findActiveIdentity(tag: NormalizedTag): Promise<Identity | null> {
    const row = await this.db.identity.findUnique({ where: { tag } });
    if (!row || row.status !== "active") {
      return null;
    }
    return row;
  }

  async resolve(tag: NormalizedTag): Promise<ResolveResponseDto> {
    const cacheKey = `resolve:${tag}`;
    const cached = await this.cache.get<ResolveResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    let row = await this.findActiveIdentity(tag);
    if (!row) {
      const fromChain = await this.chainFallback.lookup(tag);
      if (!fromChain || fromChain.status !== "active") {
        throw new NotFoundException(`tag ${presentTag(tag)} not found`);
      }
      row = fromChain;
    }

    const baseUrl = this.config.config.paymentLinkBaseUrl;
    const response: ResolveResponseDto = {
      tag: presentTag(tag),
      wallet: row.wallet,
      displayName: row.displayName,
      avatar: row.avatar,
      verified: row.verified,
      merchant: row.merchant,
      preferredToken: row.preferredToken,
      paymentLink: buildPaymentLink(baseUrl, tag),
      links: {
        profile: buildProfileLink(baseUrl, tag),
        qr: buildQrLink(baseUrl, tag),
      },
    };

    await this.cache.set(cacheKey, response);
    return response;
  }

  async identity(tag: NormalizedTag): Promise<IdentityResponseDto> {
    const cacheKey = `identity:${tag}`;
    const cached = await this.cache.get<IdentityResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const row = await this.findActiveIdentity(tag);
    if (!row) {
      throw new NotFoundException(`tag ${presentTag(tag)} not found`);
    }

    const response: IdentityResponseDto = {
      tag: presentTag(tag),
      owner: row.owner,
      wallet: row.wallet,
      displayName: row.displayName,
      avatar: row.avatar,
      bio: row.bio,
      preferredToken: row.preferredToken,
      verified: row.verified,
      merchant: row.merchant,
      createdAt: row.createdAt,
    };

    await this.cache.set(cacheKey, response);
    return response;
  }

  /**
   * Runs the full naming gate: canonical form, then reserved, then
   * profanity, then the mirror check. Unlike the other tag endpoints, a
   * non-canonical tag here is not a 400: availability exists specifically
   * to answer "can I have this name", and "no, it is not even valid" is a
   * normal answer to that question, not an exceptional one.
   */
  async availability(rawTag: string): Promise<AvailabilityResponseDto> {
    const normalized = normalizeTag(rawTag);
    if (!normalized.ok) {
      return { tag: presentTag(rawTag), available: false, reason: "invalid" };
    }

    const gateResult = await checkNamingGate(this.db, normalized.tag);
    return { tag: presentTag(normalized.tag), available: gateResult.available, reason: gateResult.reason };
  }

  /**
   * Ranked matches over active rows only: exact tag match first, then tag
   * prefix, then exact displayName match, then displayName prefix. Empty
   * query returns an empty list, never an error.
   */
  async search(rawQuery: string): Promise<SearchResultItemDto[]> {
    const query = rawQuery.trim().toLowerCase();
    if (query.length === 0) {
      return [];
    }

    const rows = await this.db.identity.findMany({
      where: {
        status: "active",
        OR: [{ tag: { startsWith: query } }, { displayName: { contains: query, mode: "insensitive" } }],
      },
      take: SEARCH_OVER_FETCH_LIMIT,
    });

    return rows
      .map((row) => ({ row, rank: rankOf(row, query) }))
      .filter(({ rank }) => rank < 4)
      // Within the same rank tier, a shorter (closer) tag match sorts first.
      .sort((a, b) => a.rank - b.rank || a.row.tag.length - b.row.tag.length)
      .slice(0, SEARCH_RESULT_LIMIT)
      .map(({ row }) => ({
        tag: presentTag(row.tag),
        displayName: row.displayName,
        avatar: row.avatar,
        verified: row.verified,
      }));
  }

  async qr(tag: NormalizedTag): Promise<QrResponseDto> {
    const row = await this.findActiveIdentity(tag);
    if (!row) {
      throw new NotFoundException(`tag ${presentTag(tag)} not found`);
    }
    return {
      tag: presentTag(tag),
      wallet: row.wallet,
      paymentLink: buildPaymentLink(this.config.config.paymentLinkBaseUrl, tag),
    };
  }

  async paymentLink(tag: NormalizedTag): Promise<PaymentLinkResponseDto> {
    const row = await this.findActiveIdentity(tag);
    if (!row) {
      throw new NotFoundException(`tag ${presentTag(tag)} not found`);
    }
    return {
      tag: presentTag(tag),
      wallet: row.wallet,
      paymentLink: buildPaymentLink(this.config.config.paymentLinkBaseUrl, tag),
    };
  }
}
