import { evidenceFromSampleSize } from "@/lib/predictor/config";
import type { Neighbor } from "@/lib/predictor/similarity";

export type OutcomeCounts = {
  accepted: number;
  notAccepted: number;
  waitlisted: number;
  unknown: number;
  total: number;
};

export type EvidenceStrength = ReturnType<typeof evidenceFromSampleSize>;

export type SchoolEvidence = {
  similarCount: number;
  outcomes: OutcomeCounts;
  evidence: EvidenceStrength;
  /** Acceptance rate among ACCEPTED + NOT_ACCEPTED + WAITLISTED (Unknown excluded). */
  acceptanceRate: number | null;
  decisiveCount: number;
};

export function tallyOutcomes(neighbors: Neighbor[]): OutcomeCounts {
  const outcomes: OutcomeCounts = {
    accepted: 0,
    notAccepted: 0,
    waitlisted: 0,
    unknown: 0,
    total: neighbors.length,
  };

  for (const n of neighbors) {
    if (n.status === "ACCEPTED") outcomes.accepted += 1;
    else if (n.status === "NOT_ACCEPTED") outcomes.notAccepted += 1;
    else if (n.status === "WAITLISTED") outcomes.waitlisted += 1;
    else outcomes.unknown += 1;
  }

  return outcomes;
}

export function buildEvidence(neighbors: Neighbor[]): SchoolEvidence {
  const outcomes = tallyOutcomes(neighbors);
  const decisiveCount =
    outcomes.accepted + outcomes.notAccepted + outcomes.waitlisted;
  const acceptanceRate =
    decisiveCount > 0 ? outcomes.accepted / decisiveCount : null;

  return {
    similarCount: neighbors.length,
    outcomes,
    evidence: evidenceFromSampleSize(neighbors.length),
    acceptanceRate,
    decisiveCount,
  };
}

export function compareSchoolEvidence(
  a: SchoolEvidence,
  b: SchoolEvidence,
): number {
  const aInsufficient = a.evidence === "Insufficient";
  const bInsufficient = b.evidence === "Insufficient";
  if (aInsufficient !== bInsufficient) {
    return aInsufficient ? 1 : -1;
  }

  const aRate = a.acceptanceRate ?? -1;
  const bRate = b.acceptanceRate ?? -1;
  if (bRate !== aRate) return bRate - aRate;

  return b.similarCount - a.similarCount;
}
