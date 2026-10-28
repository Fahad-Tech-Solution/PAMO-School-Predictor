import { describe, expect, it } from "vitest";

import {
  buildEvidence,
  compareSchoolEvidence,
  tallyOutcomes,
} from "@/lib/predictor/evidence";
import type { Neighbor } from "@/lib/predictor/similarity";

function n(
  status: Neighbor["status"],
  id: string,
): Neighbor {
  return { id, distance: 0.1, status };
}

describe("tallyOutcomes", () => {
  it("counts each status distinctly and never maps null to NOT_ACCEPTED", () => {
    const outcomes = tallyOutcomes([
      n("ACCEPTED", "a"),
      n("NOT_ACCEPTED", "b"),
      n("WAITLISTED", "c"),
      n(null, "d"),
      n(null, "e"),
    ]);
    expect(outcomes).toEqual({
      accepted: 1,
      notAccepted: 1,
      waitlisted: 1,
      unknown: 2,
      total: 5,
    });
  });
});

describe("buildEvidence", () => {
  it("excludes unknown from acceptance rate", () => {
    const evidence = buildEvidence([
      n("ACCEPTED", "a"),
      n("ACCEPTED", "b"),
      n("NOT_ACCEPTED", "c"),
      n(null, "d"),
    ]);
    expect(evidence.decisiveCount).toBe(3);
    expect(evidence.acceptanceRate).toBeCloseTo(2 / 3);
    expect(evidence.evidence).toBe("Insufficient");
  });

  it("returns null acceptance rate when all unknown", () => {
    const evidence = buildEvidence([n(null, "a"), n(null, "b")]);
    expect(evidence.acceptanceRate).toBeNull();
  });
});

describe("compareSchoolEvidence", () => {
  it("ranks sufficient evidence ahead of insufficient", () => {
    const weak = buildEvidence([n("ACCEPTED", "a")]);
    const strongNeighbors = Array.from({ length: 5 }, (_, i) =>
      n("ACCEPTED", String(i)),
    );
    const stronger = buildEvidence(strongNeighbors);
    expect(compareSchoolEvidence(stronger, weak)).toBeLessThan(0);
  });
});
