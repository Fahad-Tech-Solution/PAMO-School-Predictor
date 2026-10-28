import { z } from "zod";

import { US_STATE_CODES } from "@/lib/geo/us-states";
import { MAX_SCHOOLS } from "@/lib/predictor/config";

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
  return Number(num.toFixed(2));
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

export const predictorFormSchema = z
  .object({
    homeState: z
      .string()
      .refine(
        (value): value is (typeof US_STATE_CODES)[number] =>
          (US_STATE_CODES as readonly string[]).includes(value),
        "Select a valid US state or territory.",
      ),
    bcpGpa: z.any().transform(optionalGpa),
    overallGpa: z.any().transform(optionalGpa),
    scienceGpa: z.any().transform(optionalGpa),
    pceHours: z.any().transform(optionalPce),
    schoolIds: z
      .array(z.string().uuid())
      .min(1, "Select at least one school.")
      .max(MAX_SCHOOLS, `Select at most ${MAX_SCHOOLS} schools.`),
  })
  .superRefine((data, ctx) => {
    const hasNumeric =
      data.bcpGpa != null ||
      data.overallGpa != null ||
      data.scienceGpa != null ||
      data.pceHours != null;
    if (!hasNumeric) {
      ctx.addIssue({
        code: "custom",
        message: "Enter at least one GPA or PCE hours value.",
        path: ["bcpGpa"],
      });
    }
  });

export type PredictorFormInput = z.input<typeof predictorFormSchema>;
export type PredictorFormValues = z.output<typeof predictorFormSchema>;
