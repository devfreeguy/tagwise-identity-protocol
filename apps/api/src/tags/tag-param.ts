import { BadRequestException } from "@nestjs/common";
import { normalizeTag, type NormalizedTag } from "@tip/core";

/**
 * The :tag path param is untrusted input. Every endpoint that takes a tag
 * must run it through this first; nothing downstream ever sees the raw
 * param. Non-canonical input returns 400 with the specific rejection
 * reason, never a silent fallback.
 */
export function normalizeTagParamOrThrow(raw: string): NormalizedTag {
  const result = normalizeTag(raw);
  if (!result.ok) {
    throw new BadRequestException({
      message: `invalid tag: ${result.reason}`,
      reason: result.reason,
    });
  }
  return result.tag;
}

/**
 * Presentation adds the leading @; storage and lookups always stay
 * canonical (without it).
 */
export function presentTag(tag: string): string {
  return `@${tag}`;
}
