/**
 * Tunable predictor constants — change here without rewriting UI/engine flow.
 * Documented defaults for transparent similarity-based ranking.
 */

export const GPA_MIN = 2.7;
export const GPA_MAX = 4.0;

/** PCE hours above this are capped before normalization so scale does not dominate. */
export const PCE_CAP = 10_000;

/** Max weighted Euclidean distance for a historical row to count as "similar". */
export const SIMILARITY_MAX_DISTANCE = 0.35;

/** Cap neighbors per school after distance filter. */
export const MAX_NEIGHBORS = 100;

/** Max schools per predictor run. */
export const MAX_SCHOOLS = 30;

export const FEATURE_WEIGHTS = {
  bcpGpa: 1,
  overallGpa: 1,
  scienceGpa: 1,
  pceHours: 1,
  residency: 1,
} as const;

export type FeatureKey = keyof typeof FEATURE_WEIGHTS;

/** Evidence bands from similar-sample size. */
export function evidenceFromSampleSize(
  n: number,
): "Insufficient" | "Limited" | "Moderate" | "Strong" {
  if (n < 5) return "Insufficient";
  if (n < 20) return "Limited";
  if (n < 50) return "Moderate";
  return "Strong";
}
