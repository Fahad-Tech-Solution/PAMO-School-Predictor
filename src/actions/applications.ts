"use server";

import { eq, inArray } from "drizzle-orm";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createDb } from "@/db";
import { applicants, applications, schools } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { formValueToStatus } from "@/lib/applications/status";
import { requireAdmin } from "@/lib/auth/session";
import {
  invalidateApplicationListCountsCache,
  invalidateDashboardCountsCache,
  invalidateSchoolStatsCache,
} from "@/lib/redis/cache";
import {
  createApplicationForApplicantSchema,
  createApplicationWithApplicantSchema,
  updateApplicationSchema,
} from "@/lib/validation/application";
import { applicantFormSchema } from "@/lib/validation/applicant";

export type ApplicationActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const fail = (
  message: string,
  fieldErrors?: Record<string, string[]>,
): ApplicationActionState => ({
  ok: false,
  message,
  fieldErrors,
});

function timestampsForStatusChange(options: {
  nextStatus: ReturnType<typeof formValueToStatus>;
  previousStatus: (typeof applications.$inferSelect)["status"];
  previousWaitlistedAt: Date | null;
  previousAcceptedAt: Date | null;
}) {
  const now = new Date();
  let waitlistedAt = options.previousWaitlistedAt;
  let acceptedAt = options.previousAcceptedAt;

  if (
    options.nextStatus === "WAITLISTED" &&
    options.previousStatus !== "WAITLISTED" &&
    !waitlistedAt
  ) {
    waitlistedAt = now;
  }

  if (
    options.nextStatus === "ACCEPTED" &&
    options.previousStatus !== "ACCEPTED" &&
    !acceptedAt
  ) {
    acceptedAt = now;
  }

  return { waitlistedAt, acceptedAt };
}

async function assertSchoolsExist(schoolIds: string[]) {
  const unique = [...new Set(schoolIds)];
  const db = createDb();
  const rows = await db
    .select({ id: schools.id })
    .from(schools)
    .where(inArray(schools.id, unique));
  return rows.length === unique.length;
}

export async function createApplicationWithApplicant(
  values: unknown,
): Promise<ApplicationActionState> {
  const admin = await requireAdmin();
  const parsed = createApplicationWithApplicantSchema.safeParse(values);

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const schoolIds = [...new Set(parsed.data.schoolIds)];
  if (!(await assertSchoolsExist(schoolIds))) {
    return fail("One or more selected schools were not found.", {
      schoolIds: ["One or more selected schools were not found."],
    });
  }

  const outcomesBySchool = new Map(
    parsed.data.schoolOutcomes.map((row) => [row.schoolId, row]),
  );

  const db = createDb();
  const [applicant] = await db
    .insert(applicants)
    .values({ homeState: parsed.data.homeState })
    .returning();

  const createdApps = await db
    .insert(applications)
    .values(
      schoolIds.map((schoolId) => {
        const outcome = outcomesBySchool.get(schoolId)!;
        const status = formValueToStatus(outcome.status);
        const { waitlistedAt, acceptedAt } = timestampsForStatusChange({
          nextStatus: status,
          previousStatus: null,
          previousWaitlistedAt: null,
          previousAcceptedAt: null,
        });
        return {
          applicantId: applicant.id,
          schoolId,
          bcpGpa: parsed.data.bcpGpa,
          overallGpa: parsed.data.overallGpa,
          scienceGpa: parsed.data.scienceGpa,
          pceHours: parsed.data.pceHours,
          applicationAttempt: outcome.applicationAttempt,
          status,
          waitlistedAt,
          acceptedAt,
        };
      }),
    )
    .returning();

  after(async () => {
    await writeAuditLog({
      userId: admin.id,
      action: "CREATE APPLICANT",
      entityType: "applicant",
      entityId: applicant.id,
      newValues: applicant,
    });
    for (const application of createdApps) {
      await writeAuditLog({
        userId: admin.id,
        action: "CREATE APPLICATION",
        entityType: "application",
        entityId: application.id,
        newValues: application,
      });
    }
    await invalidateSchoolStatsCache(...schoolIds);
    await invalidateDashboardCountsCache();
    await invalidateApplicationListCountsCache();
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    revalidatePath(`/applicants/${applicant.id}`);
    for (const schoolId of schoolIds) {
      revalidatePath(`/schools/${schoolId}`);
    }
  });

  if (createdApps.length === 1) {
    redirect(`/applications/${createdApps[0]!.id}`);
  }
  redirect(`/applicants/${applicant.id}`);
}

export async function createApplicationForApplicant(
  applicantId: string,
  values: unknown,
): Promise<ApplicationActionState> {
  const admin = await requireAdmin();
  const parsed = createApplicationForApplicantSchema.safeParse(values);

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const db = createDb();
  const [applicant] = await db
    .select()
    .from(applicants)
    .where(eq(applicants.id, applicantId))
    .limit(1);

  if (!applicant) {
    return fail("Applicant not found.");
  }

  const schoolIds = [...new Set(parsed.data.schoolIds)];
  if (!(await assertSchoolsExist(schoolIds))) {
    return fail("One or more selected schools were not found.", {
      schoolIds: ["One or more selected schools were not found."],
    });
  }

  const outcomesBySchool = new Map(
    parsed.data.schoolOutcomes.map((row) => [row.schoolId, row]),
  );

  const createdApps = await db
    .insert(applications)
    .values(
      schoolIds.map((schoolId) => {
        const outcome = outcomesBySchool.get(schoolId)!;
        const status = formValueToStatus(outcome.status);
        const { waitlistedAt, acceptedAt } = timestampsForStatusChange({
          nextStatus: status,
          previousStatus: null,
          previousWaitlistedAt: null,
          previousAcceptedAt: null,
        });
        return {
          applicantId,
          schoolId,
          bcpGpa: parsed.data.bcpGpa,
          overallGpa: parsed.data.overallGpa,
          scienceGpa: parsed.data.scienceGpa,
          pceHours: parsed.data.pceHours,
          applicationAttempt: outcome.applicationAttempt,
          status,
          waitlistedAt,
          acceptedAt,
        };
      }),
    )
    .returning();

  after(async () => {
    for (const application of createdApps) {
      await writeAuditLog({
        userId: admin.id,
        action: "CREATE APPLICATION",
        entityType: "application",
        entityId: application.id,
        newValues: application,
      });
    }
    await invalidateSchoolStatsCache(...schoolIds);
    await invalidateDashboardCountsCache();
    await invalidateApplicationListCountsCache();
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    revalidatePath(`/applicants/${applicantId}`);
    for (const schoolId of schoolIds) {
      revalidatePath(`/schools/${schoolId}`);
    }
  });

  if (createdApps.length === 1) {
    redirect(`/applications/${createdApps[0]!.id}`);
  }
  redirect(`/applicants/${applicantId}`);
}

export async function updateApplication(
  applicationId: string,
  values: unknown,
): Promise<ApplicationActionState> {
  const admin = await requireAdmin();
  const parsed = updateApplicationSchema.safeParse(values);

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const db = createDb();
  const [existing] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!existing) {
    return fail("Application not found.");
  }

  if (!(await assertSchoolsExist([parsed.data.schoolId]))) {
    return fail("Selected school was not found.", {
      schoolId: ["Selected school was not found."],
    });
  }

  const status = formValueToStatus(parsed.data.status);
  const { waitlistedAt, acceptedAt } = timestampsForStatusChange({
    nextStatus: status,
    previousStatus: existing.status,
    previousWaitlistedAt: existing.waitlistedAt,
    previousAcceptedAt: existing.acceptedAt,
  });

  const [updated] = await db
    .update(applications)
    .set({
      schoolId: parsed.data.schoolId,
      bcpGpa: parsed.data.bcpGpa,
      overallGpa: parsed.data.overallGpa,
      scienceGpa: parsed.data.scienceGpa,
      pceHours: parsed.data.pceHours,
      applicationAttempt: parsed.data.applicationAttempt,
      status,
      waitlistedAt,
      acceptedAt,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId))
    .returning();

  after(async () => {
    await writeAuditLog({
      userId: admin.id,
      action: "UPDATE APPLICATION",
      entityType: "application",
      entityId: applicationId,
      oldValues: existing,
      newValues: updated,
    });
    await invalidateSchoolStatsCache(existing.schoolId, parsed.data.schoolId);
    await invalidateDashboardCountsCache();
    await invalidateApplicationListCountsCache();
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    revalidatePath(`/applications/${applicationId}`);
    revalidatePath(`/applicants/${existing.applicantId}`);
    revalidatePath(`/schools/${existing.schoolId}`);
    if (parsed.data.schoolId !== existing.schoolId) {
      revalidatePath(`/schools/${parsed.data.schoolId}`);
    }
  });

  return { ok: true, message: "Application updated." };
}

export async function updateApplicantHomeState(
  applicantId: string,
  values: unknown,
): Promise<ApplicationActionState> {
  const admin = await requireAdmin();
  const parsed = applicantFormSchema.safeParse(values);

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const db = createDb();
  const [existing] = await db
    .select()
    .from(applicants)
    .where(eq(applicants.id, applicantId))
    .limit(1);

  if (!existing) {
    return fail("Applicant not found.");
  }

  const linkedSchools = await db
    .select({ schoolId: applications.schoolId })
    .from(applications)
    .where(eq(applications.applicantId, applicantId));

  const [updated] = await db
    .update(applicants)
    .set({
      homeState: parsed.data.homeState,
      updatedAt: new Date(),
    })
    .where(eq(applicants.id, applicantId))
    .returning();

  const schoolIds = linkedSchools.map((row) => row.schoolId);

  after(async () => {
    await writeAuditLog({
      userId: admin.id,
      action: "UPDATE APPLICANT",
      entityType: "applicant",
      entityId: applicantId,
      oldValues: existing,
      newValues: updated,
    });
    await invalidateSchoolStatsCache(...schoolIds);
    await invalidateDashboardCountsCache();
    await invalidateApplicationListCountsCache();
    revalidatePath("/applications");
    revalidatePath("/dashboard");
    revalidatePath(`/applicants/${applicantId}`);
    for (const schoolId of schoolIds) {
      revalidatePath(`/schools/${schoolId}`);
    }
  });

  return { ok: true, message: "Applicant updated." };
}
