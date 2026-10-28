import "server-only";

import { eq, inArray } from "drizzle-orm";

import { createDb } from "@/db";
import { applicants, applications, schools } from "@/db/schema";
import { parseOptionalNumber } from "@/lib/predictor/normalize";

export type HistoricalApplicationRow = {
  id: string;
  schoolId: string;
  bcpGpa: number | null;
  overallGpa: number | null;
  scienceGpa: number | null;
  pceHours: number | null;
  homeState: string;
  status: "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED" | null;
};

export type SchoolMeta = {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
};

export async function loadSchoolsByIds(
  schoolIds: string[],
): Promise<SchoolMeta[]> {
  const unique = [...new Set(schoolIds)];
  if (unique.length === 0) return [];

  const db = createDb();
  const rows = await db
    .select({
      id: schools.id,
      name: schools.name,
      state: schools.state,
      isActive: schools.isActive,
    })
    .from(schools)
    .where(inArray(schools.id, unique));

  const byId = new Map(rows.map((r) => [r.id, r]));
  return unique
    .map((id) => byId.get(id))
    .filter((r): r is SchoolMeta => Boolean(r));
}

/**
 * Load historical applications for similarity.
 * Intentionally does not select accepted_at / waitlisted_at for use as features.
 */
export async function loadHistoricalApplicationsForSchools(
  schoolIds: string[],
): Promise<HistoricalApplicationRow[]> {
  const unique = [...new Set(schoolIds)];
  if (unique.length === 0) return [];

  const db = createDb();
  const rows = await db
    .select({
      id: applications.id,
      schoolId: applications.schoolId,
      bcpGpa: applications.bcpGpa,
      overallGpa: applications.overallGpa,
      scienceGpa: applications.scienceGpa,
      pceHours: applications.pceHours,
      status: applications.status,
      homeState: applicants.homeState,
    })
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .where(inArray(applications.schoolId, unique));

  return rows.map((row) => ({
    id: row.id,
    schoolId: row.schoolId,
    bcpGpa: parseOptionalNumber(row.bcpGpa),
    overallGpa: parseOptionalNumber(row.overallGpa),
    scienceGpa: parseOptionalNumber(row.scienceGpa),
    pceHours: row.pceHours,
    homeState: row.homeState,
    status: row.status,
  }));
}
