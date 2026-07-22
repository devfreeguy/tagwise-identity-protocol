import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { normalizeTag } from "@tip/core";
import type { PrismaClient } from "@tip/db";

import { DB_CLIENT } from "../../db/db.module.js";
import type { AuthenticatedRequest } from "./jwt-auth.guard.js";

type TagOwnershipRequest = AuthenticatedRequest & { params: { tag?: string } };

/**
 * Requires the authenticated pubkey (set by JwtAuthGuard, which must run
 * first in the guard chain) to own the :tag route param. Read-only: looks
 * up the mirror via @tip/db and compares owner, never writes. A missing or
 * blocked tag is 404, matching how the public read endpoints already treat
 * them, never leaking that a blocked tag exists. A real, active tag owned
 * by someone else is 403.
 *
 * Not wired to any route yet beyond being available for stages 3b and 3c to
 * use with @UseGuards(JwtAuthGuard, TagOwnershipGuard).
 */
@Injectable()
export class TagOwnershipGuard implements CanActivate {
  constructor(@Inject(DB_CLIENT) private readonly db: PrismaClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TagOwnershipRequest>();

    if (!request.authPubkey) {
      throw new ForbiddenException("authentication required before ownership can be checked");
    }

    const rawTag = request.params.tag;
    if (!rawTag) {
      throw new NotFoundException("tag not found");
    }

    const normalized = normalizeTag(rawTag);
    if (!normalized.ok) {
      throw new NotFoundException("tag not found");
    }

    const row = await this.db.identity.findUnique({ where: { tag: normalized.tag } });
    if (!row || row.status !== "active") {
      throw new NotFoundException("tag not found");
    }

    if (row.owner !== request.authPubkey) {
      throw new ForbiddenException("caller does not own this tag");
    }

    return true;
  }
}
