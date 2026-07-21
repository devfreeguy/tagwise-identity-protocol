import { Injectable } from "@nestjs/common";

export type AppConfig = Readonly<{
  port: number;
  databaseUrl: string;
  paymentLinkBaseUrl: string;
}>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`missing required environment variable ${name}`);
  }
  return value;
}

/**
 * Reads configuration directly from process.env. Env loading itself happens
 * once in main.ts via `import "dotenv/config"`, explicitly, matching the
 * rest of the workspace. This service does no auto-loading of its own.
 */
@Injectable()
export class ConfigService {
  readonly config: AppConfig;

  constructor() {
    this.config = {
      port: Number(process.env.PORT ?? "3000"),
      databaseUrl: requireEnv("DATABASE_URL"),
      paymentLinkBaseUrl: process.env.PAYMENT_LINK_BASE_URL ?? "https://tagwise.me",
    };
  }
}
