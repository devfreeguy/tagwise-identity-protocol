import "dotenv/config";
import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule } from "@nestjs/swagger";

import { GlobalExceptionFilter } from "./common/global-exception.filter.js";
import { ConfigService } from "./config/config.service.js";
import { AppModule } from "./app.module.js";
import { apiDocumentOptions, createApiDocumentConfig } from "./openapi/document-config.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.useGlobalFilters(new GlobalExceptionFilter());
  // transform: true is required for the @Transform() trim decorators on
  // UpdateIdentityRequestDto to actually affect the value the controller
  // receives; without it, Nest validates the transformed value but still
  // hands the controller the original, untransformed body.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(app, createApiDocumentConfig(), apiDocumentOptions);
  SwaggerModule.setup("docs", app, document);

  const config = app.get(ConfigService);
  await app.listen(config.config.port, "0.0.0.0");
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
