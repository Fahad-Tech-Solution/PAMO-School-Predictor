import {
  FEATURE_WEIGHTS,
  MAX_NEIGHBORS,
  SIMILARITY_MAX_DISTANCE,
  type FeatureKey,
} from "@/lib/predictor/config";
import { normalizeGpa, normalizePce } from "@/lib/predictor/normalize";
import type { Residency } from "@/lib/applications/residency";

export type CandidateFeatures = {
  bcpGpa: number | null;
  overallGpa: number | null;
  scienceGpa: number | null;
  pceHours: number | null;
  /** Candidate residency relative to the school being scored. */
  residency: Residency;
};

export type HistoricalFeatures = {
  id: string;
  bcpGpa: number | null;
  overallGpa: number | null;
  scienceGpa: number | null;
  pceHours: number | null;
  residency: Residency;
  status: "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED" | null;
};

export type Neighbor = {
  id: string;
  distance: number;
  status: HistoricalFeatures["status"];
};

type Dimension = {
  key: FeatureKey;
  weight: number;
  delta: number;
};

function buildDimensions(
  candidate: CandidateFeatures,
  historical: HistoricalFeatures,
): Dimension[] {
  const dims: Dimension[] = [];

  const numericPairs: Array<{
    key: FeatureKey;
    c: number | null;
    h: number | null;
    normalize: (n: number) => number;
  }> = [
    {
      key: "bcpGpa",
      c: candidate.bcpGpa,
      h: historical.bcpGpa,
      normalize: normalizeGpa,
    },
    {
      key: "overallGpa",
      c: candidate.overallGpa,
      h: historical.overallGpa,
      normalize: normalizeGpa,
    },
    {
      key: "scienceGpa",
      c: candidate.scienceGpa,
      h: historical.scienceGpa,
      normalize: normalizeGpa,
    },
    {
      key: "pceHours",
      c: candidate.pceHours,
      h: historical.pceHours,
      normalize: normalizePce,
    },
  ];

  for (const pair of numericPairs) {
    if (pair.c == null || pair.h == null) continue;
    dims.push({
      key: pair.key,
      weight: FEATURE_WEIGHTS[pair.key],
      delta: pair.normalize(pair.c) - pair.normalize(pair.h),
    });
  }

  // Residency always comparable when both sides derived for this school.
  dims.push({
    key: "residency",
    weight: FEATURE_WEIGHTS.residency,
    delta: candidate.residency === historical.residency ? 0 : 1,
  });

  return dims;
}

/**
 * Weighted Euclidean distance over overlapping features.
 * Weights are renormalized to present dimensions only.
 * Returns null if there is no overlapping comparable signal
 * (residency alone still counts as a dimension).
 */
export function similarityDistance(
  candidate: CandidateFeatures,
  historical: HistoricalFeatures,
): number | null {
  const dims = buildDimensions(candidate, historical);
  // Need at least residency OR one numeric overlap. Residency is always added,
  // but require at least one numeric overlap OR we still allow residency-only
  // when plan says "at least one overlapping numeric feature or residency".
  const hasNumeric = dims.some((d) => d.key !== "residency");
  if (!hasNumeric && dims.length === 0) return null;

  const weightSum = dims.reduce((sum, d) => sum + d.weight, 0);
  if (weightSum <= 0) return null;

  let sumSq = 0;
  for (const d of dims) {
    const w = d.weight / weightSum;
    sumSq += w * d.delta * d.delta;
  }
  return Math.sqrt(sumSq);
}

export function selectNeighbors(
  candidate: CandidateFeatures,
  historicalRows: HistoricalFeatures[],
  options?: {
    maxDistance?: number;
    maxNeighbors?: number;
  },
): Neighbor[] {
  const maxDistance = options?.maxDistance ?? SIMILARITY_MAX_DISTANCE;
  const maxNeighbors = options?.maxNeighbors ?? MAX_NEIGHBORS;

  const scored: Neighbor[] = [];
  for (const row of historicalRows) {
    // Require at least one overlapping numeric feature OR residency comparison.
    const hasNumericOverlap =
      (candidate.bcpGpa != null && row.bcpGpa != null) ||
      (candidate.overallGpa != null && row.overallGpa != null) ||
      (candidate.scienceGpa != null && row.scienceGpa != null) ||
      (candidate.pceHours != null && row.pceHours != null);

    if (!hasNumericOverlap) {
      // Residency-only comparison is still allowed per plan.
    }

    const distance = similarityDistance(candidate, row);
    if (distance == null) continue;
    if (distance > maxDistance) continue;
    scored.push({ id: row.id, distance, status: row.status });
  }

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, maxNeighbors);
}
