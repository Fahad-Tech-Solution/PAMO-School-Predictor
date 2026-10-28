import "server-only";

import { deriveResidency } from "@/lib/applications/residency";
import { getStateLabel } from "@/lib/geo/us-states";
import {
  buildEvidence,
  compareSchoolEvidence,
  type SchoolEvidence,
} from "@/lib/predictor/evidence";
import {
  loadHistoricalApplicationsForSchools,
  loadSchoolsByIds,
} from "@/lib/predictor/queries";
import {
  selectNeighbors,
  type CandidateFeatures,
  type HistoricalFeatures,
} from "@/lib/predictor/similarity";

export type PredictorInput = {
  homeState: string;
  bcpGpa: number | null;
  overallGpa: number | null;
  scienceGpa: number | null;
  pceHours: number | null;
  schoolIds: string[];
};

export type PredictorSchoolResult = {
  schoolId: string;
  schoolName: string;
  schoolState: string;
  schoolStateLabel: string;
  isActive: boolean;
  candidateResidency: "IN_STATE" | "OUT_OF_STATE";
  historicalPoolSize: number;
  rank: number;
} & SchoolEvidence;

export async function runPredictor(
  input: PredictorInput,
): Promise<PredictorSchoolResult[]> {
  const schoolMetas = await loadSchoolsByIds(input.schoolIds);
  const historical = await loadHistoricalApplicationsForSchools(
    schoolMetas.map((s) => s.id),
  );

  const bySchool = new Map<string, typeof historical>();
  for (const row of historical) {
    const list = bySchool.get(row.schoolId) ?? [];
    list.push(row);
    bySchool.set(row.schoolId, list);
  }

  const results: Omit<PredictorSchoolResult, "rank">[] = schoolMetas.map(
    (school) => {
      const candidateResidency = deriveResidency(
        input.homeState,
        school.state,
      );

      const candidate: CandidateFeatures = {
        bcpGpa: input.bcpGpa,
        overallGpa: input.overallGpa,
        scienceGpa: input.scienceGpa,
        pceHours: input.pceHours,
        residency: candidateResidency,
      };

      const pool = bySchool.get(school.id) ?? [];
      const historicalFeatures: HistoricalFeatures[] = pool.map((row) => ({
        id: row.id,
        bcpGpa: row.bcpGpa,
        overallGpa: row.overallGpa,
        scienceGpa: row.scienceGpa,
        pceHours: row.pceHours,
        residency: deriveResidency(row.homeState, school.state),
        status: row.status,
      }));

      const neighbors = selectNeighbors(candidate, historicalFeatures);
      const evidence = buildEvidence(neighbors);

      return {
        schoolId: school.id,
        schoolName: school.name,
        schoolState: school.state,
        schoolStateLabel: getStateLabel(school.state),
        isActive: school.isActive,
        candidateResidency,
        historicalPoolSize: pool.length,
        ...evidence,
      };
    },
  );

  results.sort(compareSchoolEvidence);

  return results.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
