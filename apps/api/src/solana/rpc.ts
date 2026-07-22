import { createSolanaRpc } from "@solana/kit";

export type ApiRpc = ReturnType<typeof createSolanaRpc>;

export const RPC_CLIENT = Symbol("RPC_CLIENT");
