import { describe, expect, it } from "vitest";

import { predictorFormSchema } from "@/lib/validation/predictor";
import { gpaSchema } from "@/lib/validation/gpa";

const schoolId = "11111111-1111-4111-8111-111111111111";

describe("gpaSchema", () => {
  it("accepts the supported range", () => {
    expect(gpaSchema.parse(2.7)).toBe(2.7);
    expect(gpaSchema.parse(4)).toBe(4);
  });

  it("rejects out-of-range GPA", () => {
    expect(() => gpaSchema.parse(2.69)).toThrow();
    expect(() => gpaSchema.parse(4.01)).toThrow();
  });
});

describe("predictorFormSchema", () => {
  it("requires home state, at least one school, and one numeric feature", () => {
    const ok = predictorFormSchema.safeParse({
      homeState: "CA",
      bcpGpa: "3.50",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      schoolIds: [schoolId],
    });
    expect(ok.success).toBe(true);

    const missingNumeric = predictorFormSchema.safeParse({
      homeState: "CA",
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      schoolIds: [schoolId],
    });
    expect(missingNumeric.success).toBe(false);

    const noSchools = predictorFormSchema.safeParse({
      homeState: "CA",
      bcpGpa: "3.5",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      schoolIds: [],
    });
    expect(noSchools.success).toBe(false);
  });

  it("rejects invalid GPA and non-integer PCE", () => {
    const badGpa = predictorFormSchema.safeParse({
      homeState: "CA",
      bcpGpa: "2.5",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      schoolIds: [schoolId],
    });
    expect(badGpa.success).toBe(false);

    const badPce = predictorFormSchema.safeParse({
      homeState: "CA",
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "12.5",
      schoolIds: [schoolId],
    });
    expect(badPce.success).toBe(false);
  });
});
