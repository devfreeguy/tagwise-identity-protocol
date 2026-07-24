import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { getBase64EncodedWireTransaction } from "@solana/kit";
import { normalizeTag } from "@tip/core";
import type { PrismaClient } from "@tip/db";

import { isValidSolanaAddress } from "../auth/ed25519.js";
import { ConfigService } from "../config/config.service.js";
import { DB_CLIENT } from "../db/db.module.js";
import { RPC_CLIENT, type ApiRpc } from "../solana/rpc.js";
import { checkNamingGate } from "../tags/naming-gate.js";
import type { RegisterResponseDto } from "./dto/register-response.dto.js";
import { InsufficientBalanceException } from "./insufficient-balance.exception.js";
import { checkSufficientBalance } from "./rent-check.js";
import { buildRegisterTagTransaction } from "./transaction-builder.js";

@Injectable()
export class RegisterService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PrismaClient,
    @Inject(RPC_CLIENT) private readonly rpc: ApiRpc,
    private readonly config: ConfigService,
  ) {}

  /**
   * Validates and builds the unsigned register_tag transaction. Never signs,
   * never submits, never writes the identities row (the indexer owns that).
   * The authenticated pubkey is always the owner; it is never taken from the
   * request body. The fee payer defaults to the owner, or to feePayer when
   * one is supplied (a sponsor covering rent and fees on the owner's
   * behalf); either way it is who the 402 balance check reads from.
   */
  async register(params: {
    rawTag: string;
    wallet: string | undefined;
    feePayer: string | undefined;
    ownerPubkey: string;
  }): Promise<RegisterResponseDto> {
    const normalized = normalizeTag(params.rawTag);
    if (!normalized.ok) {
      throw new BadRequestException({ message: `invalid tag: ${normalized.reason}`, reason: normalized.reason });
    }
    const tag = normalized.tag;

    const gateResult = await checkNamingGate(this.db, tag);
    if (!gateResult.available) {
      if (gateResult.reason === "already_registered") {
        throw new ConflictException({ message: "tag is already registered", reason: gateResult.reason });
      }
      // Both "reserved" and "inappropriate" are 403: the caller is not
      // permitted to claim this name. A single consistent status code for
      // both, documented here rather than split across 403 and 422.
      throw new ForbiddenException({ message: `tag is not available: ${gateResult.reason}`, reason: gateResult.reason });
    }

    const walletAddress = params.wallet ?? params.ownerPubkey;
    if (!isValidSolanaAddress(walletAddress)) {
      throw new BadRequestException({ message: "wallet is not a valid base58 Solana address", reason: "INVALID_WALLET" });
    }

    if (params.feePayer !== undefined && !isValidSolanaAddress(params.feePayer)) {
      throw new BadRequestException({
        message: "feePayer is not a valid base58 Solana address",
        reason: "INVALID_FEE_PAYER",
      });
    }
    const payerPubkey = params.feePayer ?? params.ownerPubkey;

    const { value: blockhash } = await this.rpc.getLatestBlockhash({ commitment: "finalized" }).send();

    const { transaction, pda } = await buildRegisterTagTransaction({
      programId: this.config.config.tipRegistryProgramId,
      tag,
      ownerPubkey: params.ownerPubkey,
      payerPubkey,
      walletAddress,
      blockhash,
    });

    const balanceCheck = await checkSufficientBalance({
      rpc: this.rpc,
      feePayer: payerPubkey,
      transaction,
    });
    if (!balanceCheck.sufficient) {
      throw new InsufficientBalanceException(balanceCheck.details);
    }

    return {
      transaction: getBase64EncodedWireTransaction(transaction),
      pda,
      lastValidBlockHeight: blockhash.lastValidBlockHeight.toString(),
    };
  }
}
