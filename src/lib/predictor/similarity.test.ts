import { describe, expect, it } from "vitest";

import {
  selectNeighbors,
  similarityDistance,
  type CandidateFeatures,
  type HistoricalFeatures,
} from "@/lib/predictor/similarity";

const candidate: CandidateFeatures = {
  bcpGpa: 3.5,
  overallGpa: 3.6,
  scienceGpa: 3.4,
  pceHours: 2000,
  residency: "IN_STATE",
};

function hist(
  overrides: Partial<HistoricalFeatures> & { id: string },
): HistoricalFeatures {
  return {
    bcpGpa: 3.5,
    overallGpa: 3.6,
    scienceGpa: 3.4,
    pceHours: 2000,
    residency: "IN_STATE",
    status: "ACCEPTED",
    ...overrides,
  };
}

describe("similarityDistance", () => {
  it("returns 0 for an identical profile", () => {
    expect(similarityDistance(candidate, hist({ id: "1" }))).toBe(0);
  });

  it("increases when residency differs", () => {
    const same = similarityDistance(candidate, hist({ id: "1" }));
    const diff = similarityDistance(
      candidate,
      hist({ id: "2", residency: "OUT_OF_STATE" }),
    );
    expect(same).toBe(0);
    expect(diff).toBeGreaterThan(0);
  });
});

describe("selectNeighbors", () => {
  it("ranks closer rows first and respects maxNeighbors", () => {
    const rows = [
      hist({ id: "far", bcpGpa: 2.8, overallGpa: 2.9, scienceGpa: 2.85 }),
      hist({ id: "near" }),
      hist({ id: "mid", bcpGpa: 3.3, overallGpa: 3.4, scienceGpa: 3.2 }),
    ];
    const neighbors = selectNeighbors(candidate, rows, { maxNeighbors: 2 });
    expect(neighbors).toHaveLength(2);
    expect(neighbors[0]?.id).toBe("near");
  });

  it("excludes rows beyond maxDistance", () => {
    const neighbors = selectNeighbors(
      candidate,
      [hist({ id: "far", bcpGpa: 2.7, overallGpa: 2.7, scienceGpa: 2.7, pceHours: 0 })],
      { maxDistance: 0.05 },
    );
    expect(neighbors).toHaveLength(0);
  });
});
