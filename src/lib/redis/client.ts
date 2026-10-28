import "server-only";

import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

/**
 * Upstash Redis REST client. Returns null when env is not configured
 * so local/dev can fall back to in-memory rate limits and uncached queries.
 */
export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}
