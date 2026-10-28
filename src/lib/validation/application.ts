import { z } from "zod";

import { US_STATE_CODES } from "@/lib/geo/us-states";

function optionalGpa(value: unknown, ctx: z.RefinementCtx) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    ctx.addIssue({ code: "custom", message: "Enter a valid GPA." });
    return z.NEVER;
  }
  if (num < 2.7 || num > 4) {
    ctx.addIssue({
      code: "custom",
      message: "GPA must be between 2.70 and 4.00.",
    });
    return z.NEVER;
  }
  return num.toFixed(2);
}

function optionalPce(value: unknown, ctx: z.RefinementCtx) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 0) {
    ctx.addIssue({
      code: "custom",
      message: "PCE hours must be a whole number ≥ 0.",
    });
    return z.NEVER;
  }
  return num;
}

export const applicationStatusValues = [
  "UNKNOWN",
  "ACCEPTED",
  "NOT_ACCEPTED",
  "WAITLISTED",
] as const;

const academicFields = {
  bcpGpa: z.any().transform(optionalGpa),
  overallGpa: z.any().transform(optionalGpa),
  scienceGpa: z.any().transform(optionalGpa),
  pceHours: z.any().transform(optionalPce),
};

const attemptAndStatusFields = {
  applicationAttempt: z.coerce
    .number()
    .int("Attempt must be a whole number.")
    .min(1, "Attempt must be at least 1."),
  status: z.enum(applicationStatusValues),
};

export const schoolOutcomeSchema = z.object({
  schoolId: z.string().uuid(),
  ...attemptAndStatusFields,
});

/** Single-school fields (edit / legacy). */
export const applicationFieldsSchema = z.object({
  schoolId: z.string().uuid("Select a school."),
  ...academicFields,
  ...attemptAndStatusFields,
});

/** Create flows: one or more schools → one application per school, with per-school status/attempt. */
export const multiSchoolApplicationFieldsSchema = z
  .object({
    schoolIds: z
      .array(z.string().uuid())
      .min(1, "Select at least one school."),
    schoolOutcomes: z.array(schoolOutcomeSchema),
    ...academicFields,
  })
  .superRefine((data, ctx) => {
    const selected = [...new Set(data.schoolIds)];
    const outcomeIds = data.schoolOutcomes.map((row) => row.schoolId);
    const outcomeSet = new Set(outcomeIds);

    if (outcomeIds.length !== selected.length || outcomeSet.size !== selected.length) {
      ctx.addIssue({
        code: "custom",
        path: ["schoolOutcomes"],
        message: "Set status and attempt for each selected school.",
      });
      return;
    }

    for (const id of selected) {
      if (!outcomeSet.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["schoolOutcomes"],
          message: "Set status and attempt for each selected school.",
        });
        return;
      }
    }
  });

export const createApplicationWithApplicantSchema =
  multiSchoolApplicationFieldsSchema.and(
    z.object({
      homeState: z
        .string()
        .refine(
          (value): value is (typeof US_STATE_CODES)[number] =>
            (US_STATE_CODES as readonly string[]).includes(value),
          "Select a valid US state or territory.",
        ),
    }),
  );

export const createApplicationForApplicantSchema =
  multiSchoolApplicationFieldsSchema;

export const updateApplicationSchema = applicationFieldsSchema;

export type ApplicationFieldsValues = z.input<typeof applicationFieldsSchema>;
export type MultiSchoolApplicationFieldsValues = z.input<
  typeof multiSchoolApplicationFieldsSchema
>;
export type CreateApplicationWithApplicantValues = z.input<
  typeof createApplicationWithApplicantSchema
>;
export type SchoolOutcomeValues = z.input<typeof schoolOutcomeSchema>;
