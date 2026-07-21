import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";

import type { IndexerConfig } from "./config.js";

export type IndexerRpc = ReturnType<typeof createSolanaRpc>;
export type IndexerRpcSubscriptions = ReturnType<typeof createSolanaRpcSubscriptions>;

export function createRpcClients(config: IndexerConfig): {
  rpc: IndexerRpc;
  rpcSubscriptions: IndexerRpcSubscriptions;
} {
  return {
    rpc: createSolanaRpc(config.rpcHttpUrl),
    rpcSubscriptions: createSolanaRpcSubscriptions(config.rpcWssUrl),
  };
}
