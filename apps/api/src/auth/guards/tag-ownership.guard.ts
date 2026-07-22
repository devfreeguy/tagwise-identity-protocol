import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import type { PrismaClient } from "@tip/db";

import { DB_CLIENT } from "../../db/db.module.js";
import { normalizeTagParamOrThrow } from "../../tags/tag-param.js";
import type { AuthenticatedRequest } from "./jwt-auth.guard.js";

type TagOwnershipRequest = AuthenticatedRequest & { params: { tag?: string } };

/**
 * Requires the authenticated pubkey (set by JwtAuthGuard, which must run
 * first in the guard chain) to own the :tag route param. Read-only: looks
 * up the mirror via @tip/db and compares owner, never writes. Tag format is
 * validated first, via the same normalizeTagParamOrThrow the public read
 * endpoints use, so malformed input is 400 here too, consistent across the
 * whole API rather than only on the routes this guard does not protect. A
 * well-formed but missing or blocked tag is 404, never leaking that a
 * blocked tag exists. A real, active tag owned by someone else is 403.
 */
@Injectable()
export class TagOwnershipGuard implements CanActivate {
  constructor(@Inject(DB_CLIENT) private readonly db: PrismaClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TagOwnershipRequest>();

    if (!request.authPubkey) {
      throw new ForbiddenException("authentication required before ownership can be checked");
    }

    const normalizedTag = normalizeTagParamOrThrow(request.params.tag ?? "");

    const row = await this.db.identity.findUnique({ where: { tag: normalizedTag } });
    if (!row || row.status !== "active") {
      throw new NotFoundException("tag not found");
    }

    if (row.owner !== request.authPubkey) {
      throw new ForbiddenException("caller does not own this tag");
    }

    return true;
  }
}
