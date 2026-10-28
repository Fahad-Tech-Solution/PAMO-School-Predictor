import "server-only";

import { getRedis } from "@/lib/redis/client";

export const CACHE_KEYS = {
  activeSchools: "pamo:cache:schools:active:v1",
  allSchools: "pamo:cache:schools:all:v1",
  schoolStats: (schoolId: string) => `pamo:cache:school:stats:${schoolId}:v4`,
  dashboardCounts: "pamo:cache:dashboard:counts:v2",
  dashboardRecentApplications: "pamo:cache:dashboard:recent-apps:v1",
  dashboardRecentSchools: "pamo:cache:dashboard:recent-schools:v1",
  applicationListCountEpoch: "pamo:cache:apps:list:count:epoch:v1",
  applicationListCount: (epoch: string | number, filterKey: string) =>
    `pamo:cache:apps:list:count:v1:${epoch}:${filterKey}`,
} as const;

/** Active school catalog — mirrors client selector refresh window. */
export const ACTIVE_SCHOOLS_TTL_SECONDS = 6 * 60 * 60;

/** School statistics aggregates. */
export const SCHOOL_STATS_TTL_SECONDS = 15 * 60;

/** Dashboard counts + recent lists (4 minutes). */
export const DASHBOARD_COUNTS_TTL_SECONDS = 240;

/** @deprecated Alias — dashboard payload shares the same TTL. */
export const DASHBOARD_TTL_SECONDS = DASHBOARD_COUNTS_TTL_SECONDS;

/** Filtered application list totals (short TTL — pagination flips reuse this). */
export const APPLICATION_LIST_COUNT_TTL_SECONDS = 60;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch (error) {
    console.error("[redis] cacheGet failed", key, error);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("[redis] cacheSet failed", key, error);
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;

  try {
    await redis.del(...keys);
  } catch (error) {
    console.error("[redis] cacheDel failed", keys, error);
  }
}

export async function invalidateActiveSchoolsCache(): Promise<void> {
  await cacheDel(CACHE_KEYS.activeSchools, CACHE_KEYS.allSchools);
}

export async function invalidateSchoolStatsCache(
  ...schoolIds: string[]
): Promise<void> {
  const unique = [...new Set(schoolIds.filter(Boolean))];
  if (unique.length === 0) return;
  await cacheDel(...unique.map((id) => CACHE_KEYS.schoolStats(id)));
}

/** Bust dashboard counts and recent activity lists. */
export async function invalidateDashboardCountsCache(): Promise<void> {
  await cacheDel(
    CACHE_KEYS.dashboardCounts,
    CACHE_KEYS.dashboardRecentApplications,
    CACHE_KEYS.dashboardRecentSchools,
  );
}

/** Bust all application list COUNT caches (new epoch prefix). */
export async function invalidateApplicationListCountsCache(): Promise<void> {
  await cacheSet(
    CACHE_KEYS.applicationListCountEpoch,
    Date.now(),
    APPLICATION_LIST_COUNT_TTL_SECONDS * 60,
  );
}

export async function getApplicationListCountEpoch(): Promise<string> {
  const epoch = await cacheGet<number>(CACHE_KEYS.applicationListCountEpoch);
  return String(epoch ?? 0);
}
