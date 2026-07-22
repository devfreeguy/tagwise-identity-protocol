import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule } from "@nestjs/throttler";

import { ConfigService } from "../config/config.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { TagOwnershipGuard } from "./guards/tag-ownership.guard.js";
import { InMemoryNonceStore, NONCE_STORE } from "./nonce-store.js";

@Module({
  imports: [
    // Secret is passed explicitly per sign/verify call in AuthService and
    // JwtAuthGuard, so no module-level secret is configured here.
    JwtModule.register({}),
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        { ttl: config.config.throttleTtlSeconds * 1000, limit: config.config.throttleLimit },
      ],
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    TagOwnershipGuard,
    // In-memory only this stage. A Redis-backed NonceStore lands in stage 2
    // and is required before running more than one instance or in
    // production; see nonce-store.ts for why.
    { provide: NONCE_STORE, useClass: InMemoryNonceStore },
  ],
  // JwtModule is re-exported (not just imported) because JwtAuthGuard
  // depends on JwtService: any module that imports AuthModule for the guard
  // needs JwtService resolvable too, or Nest can't construct the guard.
  exports: [JwtModule, JwtAuthGuard, TagOwnershipGuard],
})
export class AuthModule {}
