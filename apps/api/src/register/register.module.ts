import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "../auth/auth.module.js";
import { ConfigService } from "../config/config.service.js";
import { RegisterThrottlerGuard } from "./register-throttler.guard.js";
import { RegisterController } from "./register.controller.js";
import { RegisterService } from "./register.service.js";

@Module({
  imports: [
    AuthModule, // for JwtAuthGuard
    // A distinct throttler configuration from auth's: register has its own,
    // usually stricter, limits (REGISTER_THROTTLE_TTL / _LIMIT).
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        { ttl: config.config.registerThrottleTtlSeconds * 1000, limit: config.config.registerThrottleLimit },
      ],
      inject: [ConfigService],
    }),
  ],
  controllers: [RegisterController],
  providers: [RegisterService, RegisterThrottlerGuard],
})
export class RegisterModule {}
