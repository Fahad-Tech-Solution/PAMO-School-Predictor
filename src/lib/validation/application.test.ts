import { describe, expect, it } from "vitest";

import {
  applicationFieldsSchema,
  createApplicationWithApplicantSchema,
} from "@/lib/validation/application";

const schoolId = "22222222-2222-4222-8222-222222222222";
const schoolIdB = "33333333-3333-4333-8333-333333333333";

describe("applicationFieldsSchema", () => {
  it("accepts UNKNOWN status as a form value", () => {
    const result = applicationFieldsSchema.safeParse({
      schoolId,
      bcpGpa: "3.2",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "1000",
      greScore: "",
      applicationAttempt: "1",
      status: "UNKNOWN",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("UNKNOWN");
    }
  });

  it("keeps WAITLISTED as its own enum value", () => {
    const result = applicationFieldsSchema.safeParse({
      schoolId,
      bcpGpa: "",
      overallGpa: "3.8",
      scienceGpa: "",
      pceHours: "",
      greScore: "310",
      applicationAttempt: 2,
      status: "WAITLISTED",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("WAITLISTED");
      expect(result.data.greScore).toBe(310);
    }
  });

  it("rejects GRE scores outside 270–330", () => {
    const low = applicationFieldsSchema.safeParse({
      schoolId,
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      greScore: "269",
      applicationAttempt: 1,
      status: "UNKNOWN",
    });
    expect(low.success).toBe(false);

    const high = applicationFieldsSchema.safeParse({
      schoolId,
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      greScore: "331",
      applicationAttempt: 1,
      status: "UNKNOWN",
    });
    expect(high.success).toBe(false);
  });
});

describe("createApplicationWithApplicantSchema", () => {
  it("requires home state and at least one school", () => {
    const ok = createApplicationWithApplicantSchema.safeParse({
      homeState: "TX",
      schoolIds: [schoolId],
      schoolOutcomes: [
        {
          schoolId,
          applicationAttempt: 1,
          status: "ACCEPTED",
        },
      ],
      bcpGpa: "3.1",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      greScore: "",
    });
    expect(ok.success).toBe(true);

    const missingState = createApplicationWithApplicantSchema.safeParse({
      homeState: "",
      schoolIds: [schoolId],
      schoolOutcomes: [
        {
          schoolId,
          applicationAttempt: 1,
          status: "ACCEPTED",
        },
      ],
      bcpGpa: "3.1",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      greScore: "",
    });
    expect(missingState.success).toBe(false);
  });

  it("requires per-school status and attempt for each selected school", () => {
    const ok = createApplicationWithApplicantSchema.safeParse({
      homeState: "CA",
      schoolIds: [schoolId, schoolIdB],
      schoolOutcomes: [
        { schoolId, applicationAttempt: 1, status: "ACCEPTED" },
        { schoolId: schoolIdB, applicationAttempt: 2, status: "WAITLISTED" },
      ],
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      greScore: "305",
    });
    expect(ok.success).toBe(true);

    const missingOutcome = createApplicationWithApplicantSchema.safeParse({
      homeState: "CA",
      schoolIds: [schoolId, schoolIdB],
      schoolOutcomes: [
        { schoolId, applicationAttempt: 1, status: "ACCEPTED" },
      ],
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      greScore: "",
    });
    expect(missingOutcome.success).toBe(false);
  });
});
