/**
 * Pure-function smoke test for predictor similarity/evidence (no DB / server-only).
 * Usage: npx tsx scripts/smoke-predictor.ts
 */
import { buildEvidence } from "../src/lib/predictor/evidence";
import { selectNeighbors } from "../src/lib/predictor/similarity";

const candidate = {
  bcpGpa: 3.5,
  overallGpa: 3.6,
  scienceGpa: 3.4,
  pceHours: 2000,
  residency: "IN_STATE" as const,
};

const historical = [
  {
    id: "1",
    bcpGpa: 3.45,
    overallGpa: 3.55,
    scienceGpa: 3.35,
    pceHours: 2100,
    residency: "IN_STATE" as const,
    status: "ACCEPTED" as const,
  },
  {
    id: "2",
    bcpGpa: 3.4,
    overallGpa: 3.5,
    scienceGpa: 3.3,
    pceHours: 1900,
    residency: "OUT_OF_STATE" as const,
    status: null,
  },
  {
    id: "3",
    bcpGpa: 2.8,
    overallGpa: 2.9,
    scienceGpa: 2.85,
    pceHours: 8000,
    residency: "OUT_OF_STATE" as const,
    status: "NOT_ACCEPTED" as const,
  },
];

const neighbors = selectNeighbors(candidate, historical);
const evidence = buildEvidence(neighbors);

console.log(
  JSON.stringify(
    {
      neighborIds: neighbors.map((n) => n.id),
      similarCount: evidence.similarCount,
      evidence: evidence.evidence,
      outcomes: evidence.outcomes,
      unknownDistinct: evidence.outcomes.unknown === 1,
    },
    null,
    2,
  ),
);
