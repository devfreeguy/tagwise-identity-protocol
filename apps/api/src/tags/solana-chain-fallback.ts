import { Inject, Injectable, Logger } from "@nestjs/common";
import { decodeTagAccount, deriveTagPda, type NormalizedTag } from "@tip/core";
import type { Identity } from "@tip/db";

import { ConfigService } from "../config/config.service.js";
import { RPC_CLIENT, type ApiRpc } from "../solana/rpc.js";
import type { ChainFallback } from "./chain-fallback.js";

const logger = new Logger("SolanaChainFallback");

/**
 * Real chain-fallback cold path: when the mirror has no row at all for a
 * tag, derive its PDA via @tip/core, fetch the account from RPC at
 * finalized commitment, and decode it via @tip/core's decodeTagAccount.
 *
 * A hit here is an ANOMALY, not a normal path: it means the tag exists
 * on-chain but is missing from the mirror, which means the indexer is
 * behind, down, or broken. Logged at WARN with the tag so it is visible in
 * production, not treated as routine.
 *
 * This never writes the mirror. The indexer owns all mirror writes and has
 * the slot context needed to do so safely (guarding against an older slot
 * overwriting a newer one, see apply-change.ts); the API has no slot
 * context at all here, so writing would race the indexer and could apply
 * stale data. The mirror is repaired by the indexer's reconcile sweep, not
 * by this path. TagsService may still cache this result in Redis with a
 * short TTL (see resolveUncached), which is a cache-only decision entirely
 * separate from this rule.
 *
 * A decoded on-chain hit only has on-chain fields (tag, owner, wallet,
 * bump); every off-chain profile field the mirror would normally carry
 * (displayName, avatar, bio, preferredToken) is unavailable here, so those
 * are returned as null rather than failing the whole lookup. verified and
 * merchant are moderation/mirror-only flags with no on-chain equivalent, so
 * they default to false; status defaults to "active" since blocking is a
 * mirror-only concept a bare on-chain account cannot express (a genuinely
 * blocked tag is handled entirely at the mirror layer in
 * TagsService.resolveUncached, which never reaches this class for a
 * blocked row).
 */
@Injectable()
export class SolanaChainFallback implements ChainFallback<Identity> {
  constructor(
    @Inject(RPC_CLIENT) private readonly rpc: ApiRpc,
    private readonly config: ConfigService,
  ) {}

  async lookup(tag: string): Promise<Identity | undefined> {
    // The interface takes a plain string, but every real call site
    // (TagsService.resolve) only ever passes an already-normalized tag; the
    // cast makes that existing contract explicit here rather than silently
    // assumed.
    const normalizedTag = tag as NormalizedTag;

    const [pda] = await deriveTagPda(normalizedTag, this.config.config.tipRegistryProgramId);

    let accountData;
    try {
      const response = await this.rpc
        .getAccountInfo(pda, { commitment: "finalized", encoding: "base64" })
        .send();
      accountData = response.value;
    } catch (error) {
      // RPC unreachable: treat as not-found rather than failing the
      // resolve. A cold-path outage should degrade to "not found", never a
      // 500.
      logger.warn(`chain fallback RPC call failed for tag ${tag}, treating as not found: ${(error as Error).message}`);
      return undefined;
    }

    if (!accountData) {
      // Genuinely not registered on-chain either: a normal not-found, not
      // logged as an anomaly.
      return undefined;
    }

    let decoded;
    try {
      const raw = Buffer.from(accountData.data[0], "base64");
      decoded = decodeTagAccount(raw);
    } catch (error) {
      logger.warn(`chain fallback decode failed for tag ${tag} at ${pda}: ${(error as Error).message}`);
      return undefined;
    }

    logger.warn(
      `chain fallback HIT for tag ${tag} (pda ${pda}): exists on-chain but missing from the mirror (indexer may be behind, down, or broken)`,
    );

    return {
      id: "",
      tag: decoded.tag,
      owner: decoded.owner,
      wallet: decoded.wallet,
      bump: decoded.bump,
      displayName: null,
      avatar: null,
      bio: null,
      preferredToken: null,
      verified: false,
      merchant: false,
      status: "active",
      lastAppliedSlot: 0n,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
  }
}
