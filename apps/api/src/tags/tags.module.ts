import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "../auth/auth.module.js";
import { ConfigService } from "../config/config.service.js";
import { CACHE_READER, NoopCacheReader } from "./cache-reader.js";
import { CHAIN_FALLBACK, NotFoundChainFallback } from "./chain-fallback.js";
import { IdentityUpdateThrottlerGuard } from "./identity-update-throttler.guard.js";
import { TagsController } from "./tags.controller.js";
import { TagsService } from "./tags.service.js";
import { WalletUpdateService } from "./wallet-update.service.js";

@Module({
  imports: [
    AuthModule, // for JwtAuthGuard and TagOwnershipGuard, used by PATCH identity
    // A distinct throttler configuration from auth's and register's: PATCH
    // identity has its own limits (IDENTITY_UPDATE_THROTTLE_TTL / _LIMIT).
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        { ttl: config.config.identityUpdateThrottleTtlSeconds * 1000, limit: config.config.identityUpdateThrottleLimit },
      ],
      inject: [ConfigService],
    }),
  ],
  controllers: [TagsController],
  providers: [
    TagsService,
    WalletUpdateService,
    IdentityUpdateThrottlerGuard,
    // Stage 2 swaps these two providers for a Redis-backed CacheReader and a
    // real @solana/kit-based ChainFallback, without touching TagsService.
    { provide: CACHE_READER, useClass: NoopCacheReader },
    { provide: CHAIN_FALLBACK, useClass: NotFoundChainFallback },
  ],
})
export class TagsModule {}
