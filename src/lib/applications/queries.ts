import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { cache } from "react";

import { createDb } from "@/db";
import {
  applicants,
  applications,
  schools,
  type Applicant,
  type Application,
  type School,
} from "@/db/schema";
import {
  deriveResidency,
  type Residency,
} from "@/lib/applications/residency";
import {
  APPLICATION_LIST_COUNT_TTL_SECONDS,
  CACHE_KEYS,
  cacheGet,
  cacheSet,
  getApplicationListCountEpoch,
} from "@/lib/redis/cache";

export type ApplicationListFilters = {
  schoolId?: string;
  status?: "all" | "UNKNOWN" | "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED";
  attempt?: "all" | "1" | "2" | "3" | "4" | "5" | "6plus";
  homeStates?: string[];
  residency?: "all" | "IN_STATE" | "OUT_OF_STATE";
  page?: number;
  pageSize?: number;
};

export type ApplicationListItem = {
  application: Application;
  applicant: Applicant;
  school: School;
  residency: Residency;
};

export type ApplicationListResult = {
  items: ApplicationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildWhere(filters: ApplicationListFilters): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.schoolId) {
    clauses.push(eq(applications.schoolId, filters.schoolId));
  }

  if (filters.homeStates && filters.homeStates.length > 0) {
    clauses.push(inArray(applicants.homeState, filters.homeStates));
  }

  if (filters.status && filters.status !== "all") {
    if (filters.status === "UNKNOWN") {
      clauses.push(isNull(applications.status));
    } else {
      clauses.push(eq(applications.status, filters.status));
    }
  }

  if (filters.attempt && filters.attempt !== "all") {
    if (filters.attempt === "6plus") {
      clauses.push(gte(applications.applicationAttempt, 6));
    } else {
      clauses.push(
        eq(applications.applicationAttempt, Number(filters.attempt)),
      );
    }
  }

  if (filters.residency === "IN_STATE") {
    clauses.push(sql`${applicants.homeState} = ${schools.state}`);
  } else if (filters.residency === "OUT_OF_STATE") {
    clauses.push(sql`${applicants.homeState} <> ${schools.state}`);
  }

  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return and(...clauses);
}

function applicationListFilterKey(filters: ApplicationListFilters): string {
  return [
    filters.schoolId ?? "",
    filters.status ?? "all",
    filters.attempt ?? "all",
    (filters.homeStates ?? []).slice().sort().join(","),
    filters.residency ?? "all",
  ].join("|");
}

export async function listApplications(
  filters: ApplicationListFilters = {},
): Promise<ApplicationListResult> {
  const db = createDb();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const where = buildWhere(filters);

  // COUNT(*) is expensive at ~10k; cache by filter set so page flips reuse it.
  const epoch = await getApplicationListCountEpoch();
  const countKey = CACHE_KEYS.applicationListCount(
    epoch,
    applicationListFilterKey(filters),
  );
  let total = await cacheGet<number>(countKey);
  if (total == null) {
    const [totalRow] = await db
      .select({ value: count() })
      .from(applications)
      .innerJoin(applicants, eq(applications.applicantId, applicants.id))
      .innerJoin(schools, eq(applications.schoolId, schools.id))
      .where(where);
    total = Number(totalRow?.value ?? 0);
    await cacheSet(countKey, total, APPLICATION_LIST_COUNT_TTL_SECONDS);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = await db
    .select({
      application: applications,
      applicant: applicants,
      school: schools,
    })
    .from(applications)
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .innerJoin(schools, eq(applications.schoolId, schools.id))
    .where(where)
    .orderBy(desc(applications.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return {
    items: rows.map((row) => ({
      ...row,
      residency: deriveResidency(row.applicant.homeState, row.school.state),
    })),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

/** Request-scoped memo so layout/page/loaders don't double-hit the DB. */
export const getApplicationById = cache(
  async (
    id: string,
  ): Promise<{
    application: Application;
    applicant: Applicant;
    school: School;
    residency: Residency;
  } | null> => {
    const db = createDb();
    const [row] = await db
      .select({
        application: applications,
        applicant: applicants,
        school: schools,
      })
      .from(applications)
      .innerJoin(applicants, eq(applications.applicantId, applicants.id))
      .innerJoin(schools, eq(applications.schoolId, schools.id))
      .where(eq(applications.id, id))
      .limit(1);

    if (!row) return null;

    return {
      ...row,
      residency: deriveResidency(row.applicant.homeState, row.school.state),
    };
  },
);

export const getApplicantById = cache(
  async (
    id: string,
  ): Promise<{
    applicant: Applicant;
    applications: Array<{
      application: Application;
      school: School;
      residency: Residency;
    }>;
  } | null> => {
    const db = createDb();
    const [applicant] = await db
      .select()
      .from(applicants)
      .where(eq(applicants.id, id))
      .limit(1);

    if (!applicant) return null;

    const rows = await db
      .select({
        application: applications,
        school: schools,
      })
      .from(applications)
      .innerJoin(schools, eq(applications.schoolId, schools.id))
      .where(eq(applications.applicantId, id))
      .orderBy(desc(applications.createdAt));

    return {
      applicant,
      applications: rows.map((row) => ({
        ...row,
        residency: deriveResidency(applicant.homeState, row.school.state),
      })),
    };
  },
);
