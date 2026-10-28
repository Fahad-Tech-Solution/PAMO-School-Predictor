import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";

import { getRedis } from "@/lib/redis/client";

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/** Auth abuse limits (per IP). */
export const AUTH_RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  magicLink: { limit: 5, windowMs: 15 * 60 * 1000 },
  passwordReset: { limit: 5, windowMs: 15 * 60 * 1000 },
  updatePassword: { limit: 10, windowMs: 15 * 60 * 1000 },
} as const;

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const key = `${limit}:${windowMs}`;
  const existing = upstashLimiters.get(key);
  if (existing) return existing;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, `${windowSec} s`),
    prefix: "pamo:ratelimit",
    analytics: false,
  });
  upstashLimiters.set(key, limiter);
  return limiter;
}

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true };
}

/**
 * Fixed-window rate limit. Uses Upstash Redis when configured;
 * falls back to in-memory (single instance) otherwise.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowMs);

  if (limiter) {
    try {
      const result = await limiter.limit(key);
      if (result.success) return { ok: true };
      return {
        ok: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000),
        ),
      };
    } catch (error) {
      console.error("[redis] rate limit failed; using memory fallback", error);
    }
  }

  return checkMemoryRateLimit(key, limit, windowMs);
}

export async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}
