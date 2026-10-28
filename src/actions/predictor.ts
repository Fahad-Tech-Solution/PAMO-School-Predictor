"use server";

import { requireAuth } from "@/lib/auth/session";
import { runPredictor, type PredictorSchoolResult } from "@/lib/predictor/run";
import {
  predictorFormSchema,
  type PredictorFormInput,
} from "@/lib/validation/predictor";

export type PredictorActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  results?: PredictorSchoolResult[];
};

export async function runPredictorAction(
  values: PredictorFormInput,
): Promise<PredictorActionState> {
  await requireAuth();

  const parsed = predictorFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const uniqueSchoolIds = [...new Set(parsed.data.schoolIds)];

  try {
    const results = await runPredictor({
      homeState: parsed.data.homeState,
      bcpGpa: parsed.data.bcpGpa,
      overallGpa: parsed.data.overallGpa,
      scienceGpa: parsed.data.scienceGpa,
      pceHours: parsed.data.pceHours,
      schoolIds: uniqueSchoolIds,
    });

    if (results.length === 0) {
      return {
        ok: false,
        message: "None of the selected schools could be found.",
      };
    }

    return {
      ok: true,
      message: `Compared historical applications across ${results.length} school${results.length === 1 ? "" : "s"}.`,
      results,
    };
  } catch (error) {
    console.error("[predictor]", error);
    return {
      ok: false,
      message: "Unable to run the predictor right now. Try again.",
    };
  }
}
