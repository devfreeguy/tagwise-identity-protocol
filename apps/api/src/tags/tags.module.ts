import { Module } from "@nestjs/common";

import { CACHE_READER, NoopCacheReader } from "./cache-reader.js";
import { CHAIN_FALLBACK, NotFoundChainFallback } from "./chain-fallback.js";
import { TagsController } from "./tags.controller.js";
import { TagsService } from "./tags.service.js";

@Module({
  controllers: [TagsController],
  providers: [
    TagsService,
    // Stage 2 swaps these two providers for a Redis-backed CacheReader and a
    // real @solana/kit-based ChainFallback, without touching TagsService.
    { provide: CACHE_READER, useClass: NoopCacheReader },
    { provide: CHAIN_FALLBACK, useClass: NotFoundChainFallback },
  ],
})
export class TagsModule {}
