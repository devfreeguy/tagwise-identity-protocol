import { DocumentBuilder, type SwaggerDocumentOptions } from "@nestjs/swagger";

/**
 * Single source for the OpenAPI document's title/description/servers, used
 * by both main.ts (the live /docs Swagger UI) and generate-spec.ts (the
 * build-time export apps/docs consumes), so the two can never drift apart.
 */
export function createApiDocumentConfig(): ReturnType<DocumentBuilder["build"]> {
  return new DocumentBuilder()
    .setTitle("TIP API")
    .setDescription("Public read endpoints and wallet-signature auth for the TIP protocol")
    .setVersion("1.0")
    .addBearerAuth()
    .addServer("https://tip.tagwise.me", "Production")
    .addServer("http://localhost:3000", "Local development")
    .build();
}

/**
 * autoTagControllers is disabled because TagsController deliberately has no
 * class-level @ApiTags: its endpoints split across "Tags" and "Profile" at
 * the method level. Left at its default, Nest falls back to a tag derived
 * from the class name ("TagsController" -> "Tags") and merges it with each
 * method's own tag, so every Profile endpoint would incorrectly show up
 * under both "Tags" and "Profile".
 */
export const apiDocumentOptions: SwaggerDocumentOptions = {
  autoTagControllers: false,
};
