import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

import { ConfigService } from "../config/config.service.js";
import { RedisThrottlerStorage } from "../redis/redis-throttler-storage.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { TagOwnershipGuard } from "./guards/tag-ownership.guard.js";
import { NONCE_STORE } from "./nonce-store.js";
import { RedisNonceStore } from "./redis-nonce-store.js";

@Module({
  imports: [
    // Secret is passed explicitly per sign/verify call in AuthService and
    // JwtAuthGuard, so no module-level secret is configured here.
    JwtModule.register({}),
    // Storage only changed to Redis this stage; the limits are unchanged.
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService, storage: RedisThrottlerStorage) => ({
        storage,
        throttlers: [{ ttl: config.config.throttleTtlSeconds * 1000, limit: config.config.throttleLimit }],
      }),
      inject: [ConfigService, RedisThrottlerStorage],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    TagOwnershipGuard,
    // Redis-backed unconditionally: see nonce-store.ts for why an in-memory
    // fallback here is a deploy blocker, not a tradeoff.
    { provide: NONCE_STORE, useClass: RedisNonceStore },
  ],
  // JwtModule is re-exported (not just imported) because JwtAuthGuard
  // depends on JwtService: any module that imports AuthModule for the guard
  // needs JwtService resolvable too, or Nest can't construct the guard.
  exports: [JwtModule, JwtAuthGuard, TagOwnershipGuard],
})
export class AuthModule {}
