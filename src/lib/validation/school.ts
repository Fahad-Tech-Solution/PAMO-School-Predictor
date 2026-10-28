import { z } from "zod";

import { US_STATE_CODES } from "@/lib/geo/us-states";

export const schoolFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "School name is required.")
    .max(200, "School name is too long."),
  state: z.enum(US_STATE_CODES, {
    message: "Select a valid US state or territory.",
  }),
  requiresGre: z.boolean(),
  isActive: z.boolean(),
});

export type SchoolFormValues = z.infer<typeof schoolFormSchema>;
