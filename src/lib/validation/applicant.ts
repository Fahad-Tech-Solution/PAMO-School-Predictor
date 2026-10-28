import { z } from "zod";

import { US_STATE_CODES } from "@/lib/geo/us-states";

export const applicantFormSchema = z.object({
  homeState: z.enum(US_STATE_CODES, {
    message: "Select a valid US state or territory.",
  }),
});

export type ApplicantFormValues = z.infer<typeof applicantFormSchema>;
