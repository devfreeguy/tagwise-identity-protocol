import { Global, Module } from "@nestjs/common";
import { createSolanaRpc } from "@solana/kit";

import { ConfigService } from "../config/config.service.js";
import { RPC_CLIENT } from "./rpc.js";

@Global()
@Module({
  providers: [
    {
      provide: RPC_CLIENT,
      useFactory: (config: ConfigService) => createSolanaRpc(config.config.rpcHttpUrl),
      inject: [ConfigService],
    },
  ],
  exports: [RPC_CLIENT],
})
export class RpcModule {}
