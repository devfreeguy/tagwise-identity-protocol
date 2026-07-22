import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { getBase64EncodedWireTransaction } from "@solana/kit";
import type { NormalizedTag } from "@tip/core";
import type { PrismaClient } from "@tip/db";

import { isValidSolanaAddress } from "../auth/ed25519.js";
import { ConfigService } from "../config/config.service.js";
import { DB_CLIENT } from "../db/db.module.js";
import { RPC_CLIENT, type ApiRpc } from "../solana/rpc.js";
import type { UpdateWalletResponseDto } from "./dto/update-wallet-response.dto.js";
import { presentTag } from "./tag-param.js";
import { buildUpdateWalletTransaction } from "./wallet-transaction-builder.js";

/**
 * Builds the unsigned update_wallet transaction for a tag's owner to sign
 * and submit themselves. This never writes the mirror: the wallet column
 * changes only once the indexer observes the on-chain update_wallet
 * instruction land, exactly like register_tag.
 */
@Injectable()
export class WalletUpdateService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PrismaClient,
    @Inject(RPC_CLIENT) private readonly rpc: ApiRpc,
    private readonly config: ConfigService,
  ) {}

  async buildTransaction(params: {
    tag: NormalizedTag;
    ownerPubkey: string;
    newWallet: string;
  }): Promise<UpdateWalletResponseDto> {
    const row = await this.db.identity.findUnique({ where: { tag: params.tag } });
    if (!row || row.status !== "active") {
      throw new NotFoundException(`tag ${presentTag(params.tag)} not found`);
    }
    if (row.owner !== params.ownerPubkey) {
      throw new ForbiddenException("caller does not own this tag");
    }

    if (!isValidSolanaAddress(params.newWallet)) {
      throw new BadRequestException({ message: "wallet is not a valid base58 Solana address", reason: "INVALID_WALLET" });
    }

    const { value: blockhash } = await this.rpc.getLatestBlockhash({ commitment: "finalized" }).send();

    const { transaction, pda } = await buildUpdateWalletTransaction({
      programId: this.config.config.tipRegistryProgramId,
      tag: params.tag,
      ownerPubkey: params.ownerPubkey,
      newWallet: params.newWallet,
      blockhash,
    });

    return {
      transaction: getBase64EncodedWireTransaction(transaction),
      pda,
      lastValidBlockHeight: blockhash.lastValidBlockHeight.toString(),
    };
  }
}
