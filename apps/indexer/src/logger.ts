import pino from "pino";

export const logger = pino({
  name: "tip-indexer",
  level: process.env.LOG_LEVEL ?? "info",
});

export type Logger = typeof logger;
