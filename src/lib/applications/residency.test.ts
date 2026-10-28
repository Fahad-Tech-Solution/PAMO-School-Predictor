import { describe, expect, it } from "vitest";

import { deriveResidency, residencyLabel } from "@/lib/applications/residency";

describe("deriveResidency", () => {
  it("marks matching states as in-state", () => {
    expect(deriveResidency("CA", "CA")).toBe("IN_STATE");
  });

  it("marks mismatched states as out-of-state", () => {
    expect(deriveResidency("CA", "NY")).toBe("OUT_OF_STATE");
  });
});

describe("residencyLabel", () => {
  it("returns display labels", () => {
    expect(residencyLabel("IN_STATE")).toBe("In-state");
    expect(residencyLabel("OUT_OF_STATE")).toBe("Out-of-state");
  });
});
