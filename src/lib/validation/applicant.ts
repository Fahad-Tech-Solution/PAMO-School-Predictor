import { z } from "zod";

import { US_STATE_CODES } from "@/lib/geo/us-states";

const NAME_MAX = 80;

function optionalName(value: unknown, ctx: z.RefinementCtx) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.length > NAME_MAX) {
    ctx.addIssue({
      code: "custom",
      message: `Name must be at most ${NAME_MAX} characters.`,
    });
    return z.NEVER;
  }
  return raw;
}

export const applicantNameFieldsSchema = z.object({
  lastName: z.any().transform(optionalName),
  firstName: z.any().transform(optionalName),
});

export const applicantFormSchema = z.object({
  homeState: z.enum(US_STATE_CODES, {
    message: "Select a valid US state or territory.",
  }),
  ...applicantNameFieldsSchema.shape,
});

export type ApplicantFormValues = z.input<typeof applicantFormSchema>;
export type ApplicantFormParsed = z.output<typeof applicantFormSchema>;
