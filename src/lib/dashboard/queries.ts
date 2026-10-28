import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { createDb } from "@/db";
import { applicants, applications, schools } from "@/db/schema";
import { deriveResidency } from "@/lib/applications/residency";
import {
  statusLabel,
  type ApplicationStatusValue,
} from "@/lib/applications/status";
import {
  CACHE_KEYS,
  DASHBOARD_TTL_SECONDS,
  cacheGet,
  cacheSet,
} from "@/lib/redis/cache";

export type DashboardCounts = {
  schoolsTotal: number;
  schoolsActive: number;
  applicants: number;
  applications: number;
  accepted: number;
  notAccepted: number;
  waitlisted: number;
  unknown: number;
};

export type DashboardRecentApplication = {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolState: string;
  homeState: string;
  residency: "IN_STATE" | "OUT_OF_STATE";
  status: ApplicationStatusValue;
  statusLabel: string;
  createdAt: Date;
};

export type DashboardRecentSchool = {
  id: string;
  name: string;
  state: string;
  requiresGre: boolean;
  isActive: boolean;
  createdAt: Date;
};

function asNumber(value: unknown): number {
  return Number(value ?? 0);
}

/**
 * Three round-trips instead of eight:
 * schools (total+active), applicants, applications (all status buckets).
 */
async function computeDashboardCounts(): Promise<DashboardCounts> {
  const db = createDb();

  const [[schoolRow], [applicantsRow], [appRow]] = await Promise.all([
    db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${schools.isActive})`,
      })
      .from(schools),
    db.select({ value: count() }).from(applicants),
    db
      .select({
        total: count(),
        accepted: sql<number>`count(*) filter (where ${applications.status} = 'ACCEPTED')`,
        notAccepted: sql<number>`count(*) filter (where ${applications.status} = 'NOT_ACCEPTED')`,
        waitlisted: sql<number>`count(*) filter (where ${applications.status} = 'WAITLISTED')`,
        unknown: sql<number>`count(*) filter (where ${applications.status} is null)`,
      })
      .from(applications),
  ]);

  return {
    schoolsTotal: asNumber(schoolRow?.total),
    schoolsActive: asNumber(schoolRow?.active),
    applicants: asNumber(applicantsRow?.value),
    applications: asNumber(appRow?.total),
    accepted: asNumber(appRow?.accepted),
    notAccepted: asNumber(appRow?.notAccepted),
    waitlisted: asNumber(appRow?.waitlisted),
    unknown: asNumber(appRow?.unknown),
  };
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const cached = await cacheGet<DashboardCounts>(CACHE_KEYS.dashboardCounts);
  if (cached) return cached;

  const counts = await computeDashboardCounts();
  await cacheSet(CACHE_KEYS.dashboardCounts, counts, DASHBOARD_TTL_SECONDS);
  return counts;
}

function reviveRecentApplications(
  rows: DashboardRecentApplication[],
): DashboardRecentApplication[] {
  return rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
  }));
}

function reviveRecentSchools(
  rows: DashboardRecentSchool[],
): DashboardRecentSchool[] {
  return rows.map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
  }));
}

async function fetchRecentApplications(
  limit: number,
): Promise<DashboardRecentApplication[]> {
  const db = createDb();
  const rows = await db
    .select({
      id: applications.id,
      schoolId: applications.schoolId,
      schoolName: schools.name,
      schoolState: schools.state,
      homeState: applicants.homeState,
      status: applications.status,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .innerJoin(schools, eq(applications.schoolId, schools.id))
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .orderBy(desc(applications.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    schoolId: row.schoolId,
    schoolName: row.schoolName,
    schoolState: row.schoolState,
    homeState: row.homeState,
    residency: deriveResidency(row.homeState, row.schoolState),
    status: row.status,
    statusLabel: statusLabel(row.status),
    createdAt: row.createdAt,
  }));
}

export async function getRecentApplications(
  limit = 5,
): Promise<DashboardRecentApplication[]> {
  if (limit === 5) {
    const cached = await cacheGet<DashboardRecentApplication[]>(
      CACHE_KEYS.dashboardRecentApplications,
    );
    if (cached) return reviveRecentApplications(cached);
  }

  const rows = await fetchRecentApplications(limit);
  if (limit === 5) {
    await cacheSet(
      CACHE_KEYS.dashboardRecentApplications,
      rows,
      DASHBOARD_TTL_SECONDS,
    );
  }
  return rows;
}

async function fetchRecentSchools(
  limit: number,
): Promise<DashboardRecentSchool[]> {
  const db = createDb();
  return db
    .select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      requiresGre: schools.requiresGre,
      isActive: schools.isActive,
      createdAt: schools.createdAt,
    })
    .from(schools)
    .orderBy(desc(schools.createdAt))
    .limit(limit);
}

export async function getRecentSchools(
  limit = 5,
): Promise<DashboardRecentSchool[]> {
  if (limit === 5) {
    const cached = await cacheGet<DashboardRecentSchool[]>(
      CACHE_KEYS.dashboardRecentSchools,
    );
    if (cached) return reviveRecentSchools(cached);
  }

  const rows = await fetchRecentSchools(limit);
  if (limit === 5) {
    await cacheSet(
      CACHE_KEYS.dashboardRecentSchools,
      rows,
      DASHBOARD_TTL_SECONDS,
    );
  }
  return rows;
}

/** Convenience parallel load for the dashboard page. */
export async function getDashboardData() {
  const [counts, recentApplications, recentSchools] = await Promise.all([
    getDashboardCounts(),
    getRecentApplications(5),
    getRecentSchools(5),
  ]);

  return { counts, recentApplications, recentSchools };
}
