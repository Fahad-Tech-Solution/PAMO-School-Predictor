import "server-only";

import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { applicants, applications, schools } from "@/db/schema";
import { deriveResidency } from "@/lib/applications/residency";
import {
  CACHE_KEYS,
  SCHOOL_STATS_TTL_SECONDS,
  cacheGet,
  cacheSet,
} from "@/lib/redis/cache";
import {
  countAttempts,
  countIntoBins,
  countOutcomes,
  countResidency,
  GPA_BINS,
  PCE_BINS,
  type ChartDatum,
} from "@/lib/statistics/bins";

export type SchoolStatistics = {
  schoolId: string;
  totalApplications: number;
  residency: ChartDatum[];
  outcomes: ChartDatum[];
  attempts: ChartDatum[];
  bcpGpa: ChartDatum[];
  overallGpa: ChartDatum[];
  scienceGpa: ChartDatum[];
  pceHours: ChartDatum[];
  /** Summary averages — null when no numeric values recorded. */
  averages: {
    bcpGpa: number | null;
    overallGpa: number | null;
    scienceGpa: number | null;
    pceHours: number | null;
    bcpGpaN: number;
    overallGpaN: number;
    scienceGpaN: number;
    pceHoursN: number;
  };
};

function parseNumeric(value: string | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return sum / values.length;
}

const emptyAverages: SchoolStatistics["averages"] = {
  bcpGpa: null,
  overallGpa: null,
  scienceGpa: null,
  pceHours: null,
  bcpGpaN: 0,
  overallGpaN: 0,
  scienceGpaN: 0,
  pceHoursN: 0,
};

async function computeSchoolStatistics(
  schoolId: string,
): Promise<SchoolStatistics | null> {
  const db = createDb();

  const [school] = await db
    .select({ id: schools.id, state: schools.state })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school) return null;

  const rows = await db
    .select({
      status: applications.status,
      applicationAttempt: applications.applicationAttempt,
      bcpGpa: applications.bcpGpa,
      overallGpa: applications.overallGpa,
      scienceGpa: applications.scienceGpa,
      pceHours: applications.pceHours,
      homeState: applicants.homeState,
    })
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(eq(applications.schoolId, schoolId));

  const totalApplications = rows.length;

  const empty: SchoolStatistics = {
    schoolId,
    totalApplications: 0,
    residency: countResidency([]),
    outcomes: countOutcomes([]),
    attempts: countAttempts([]),
    bcpGpa: countIntoBins([], GPA_BINS),
    overallGpa: countIntoBins([], GPA_BINS),
    scienceGpa: countIntoBins([], GPA_BINS),
    pceHours: countIntoBins([], PCE_BINS),
    averages: emptyAverages,
  };

  if (totalApplications === 0) {
    return empty;
  }

  const residencies = rows.map((row) =>
    deriveResidency(row.homeState, school.state),
  );
  const statuses = rows.map((row) => row.status);
  const attempts = rows.map((row) => row.applicationAttempt);

  const bcpValues = rows
    .map((row) => parseNumeric(row.bcpGpa))
    .filter((n): n is number => n != null);
  const overallValues = rows
    .map((row) => parseNumeric(row.overallGpa))
    .filter((n): n is number => n != null);
  const scienceValues = rows
    .map((row) => parseNumeric(row.scienceGpa))
    .filter((n): n is number => n != null);
  const pceValues = rows
    .map((row) => row.pceHours)
    .filter((n): n is number => n != null);

  return {
    schoolId,
    totalApplications,
    residency: countResidency(residencies),
    outcomes: countOutcomes(statuses),
    attempts: countAttempts(attempts),
    bcpGpa: countIntoBins(bcpValues, GPA_BINS),
    overallGpa: countIntoBins(overallValues, GPA_BINS),
    scienceGpa: countIntoBins(scienceValues, GPA_BINS),
    pceHours: countIntoBins(pceValues, PCE_BINS),
    averages: {
      bcpGpa: average(bcpValues),
      overallGpa: average(overallValues),
      scienceGpa: average(scienceValues),
      pceHours: average(pceValues),
      bcpGpaN: bcpValues.length,
      overallGpaN: overallValues.length,
      scienceGpaN: scienceValues.length,
      pceHoursN: pceValues.length,
    },
  };
}

/**
 * Aggregate chart series for one school from historical applications.
 * Cached in Upstash Redis when configured. Null GPA/PCE omitted from distributions.
 */
export async function getSchoolStatistics(
  schoolId: string,
): Promise<SchoolStatistics | null> {
  const cacheKey = CACHE_KEYS.schoolStats(schoolId);
  const cached = await cacheGet<SchoolStatistics>(cacheKey);
  if (cached) return cached;

  const stats = await computeSchoolStatistics(schoolId);
  if (!stats) return null;

  await cacheSet(cacheKey, stats, SCHOOL_STATS_TTL_SECONDS);
  return stats;
}
