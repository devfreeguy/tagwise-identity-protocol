import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "../auth/auth.module.js";
import { ConfigService } from "../config/config.service.js";
import { RedisThrottlerStorage } from "../redis/redis-throttler-storage.js";
import { CACHE_READER } from "./cache-reader.js";
import { CHAIN_FALLBACK } from "./chain-fallback.js";
import { IdentityUpdateThrottlerGuard } from "./identity-update-throttler.guard.js";
import { RedisCacheReader } from "./redis-cache-reader.js";
import { SolanaChainFallback } from "./solana-chain-fallback.js";
import { TagsController } from "./tags.controller.js";
import { TagsService } from "./tags.service.js";
import { WalletUpdateService } from "./wallet-update.service.js";

@Module({
  imports: [
    AuthModule, // for JwtAuthGuard and TagOwnershipGuard, used by PATCH identity
    // A distinct throttler configuration from auth's and register's: PATCH
    // identity has its own limits (IDENTITY_UPDATE_THROTTLE_TTL / _LIMIT).
    // Storage only changed to Redis this stage; the limits and key strategy
    // (IdentityUpdateThrottlerGuard) are unchanged.
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService, storage: RedisThrottlerStorage) => ({
        storage,
        throttlers: [
          { ttl: config.config.identityUpdateThrottleTtlSeconds * 1000, limit: config.config.identityUpdateThrottleLimit },
        ],
      }),
      inject: [ConfigService, RedisThrottlerStorage],
    }),
  ],
  controllers: [TagsController],
  providers: [
    TagsService,
    WalletUpdateService,
    IdentityUpdateThrottlerGuard,
    // Stage 2b: Redis-backed CacheReader (resolve only, see
    // RedisCacheReader) and a real @solana/kit-based ChainFallback.
    { provide: CACHE_READER, useClass: RedisCacheReader },
    { provide: CHAIN_FALLBACK, useClass: SolanaChainFallback },
  ],
})
export class TagsModule {}
