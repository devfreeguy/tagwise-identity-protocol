import type { Redis } from "ioredis";

export type ApiRedis = Redis;

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

/** Builds the tip:<subConcern>:<rest> key namespace so one Redis instance can be shared safely across concerns. */
export function redisKey(prefix: string, subConcern: string, ...rest: string[]): string {
  return [prefix + subConcern, ...rest].join(":");
}
