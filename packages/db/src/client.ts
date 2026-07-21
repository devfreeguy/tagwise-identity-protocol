import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";

/**
 * Creates a new PrismaClient wired to a PrismaPg driver adapter over
 * connectionString, or process.env.DATABASE_URL if connectionString is
 * omitted. Does not connect at import time or on construction; the API and
 * indexer each own their own client's lifecycle.
 */
export function createDbClient(connectionString?: string): PrismaClient {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "createDbClient: no connection string provided and DATABASE_URL is not set",
    );
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}
