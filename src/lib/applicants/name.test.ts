import { describe, expect, it } from "vitest";

import {
  formatApplicantLabel,
  formatApplicantName,
} from "@/lib/applicants/name";

describe("formatApplicantName", () => {
  it("formats Last, First", () => {
    expect(
      formatApplicantName({ lastName: "Smith", firstName: "Jordan" }),
    ).toBe("Smith, Jordan");
  });

  it("handles partial and blank names", () => {
    expect(formatApplicantName({ lastName: "Smith", firstName: "" })).toBe(
      "Smith",
    );
    expect(formatApplicantName({ lastName: null, firstName: "Jordan" })).toBe(
      "Jordan",
    );
    expect(formatApplicantName({ lastName: "  ", firstName: null })).toBeNull();
  });
});

describe("formatApplicantLabel", () => {
  it("falls back to Unnamed · home state when name is missing", () => {
    expect(
      formatApplicantLabel({
        lastName: null,
        firstName: null,
        homeStateLabel: "California",
      }),
    ).toBe("Unnamed · California");
  });

  it("prefers the formatted name when present", () => {
    expect(
      formatApplicantLabel({
        lastName: "Rivera",
        firstName: "Casey",
        homeStateLabel: "Texas",
      }),
    ).toBe("Rivera, Casey");
  });
});
