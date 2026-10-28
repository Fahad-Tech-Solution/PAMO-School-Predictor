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
      applicationAttempt: 2,
      status: "WAITLISTED",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("WAITLISTED");
    }
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
    });
    expect(missingOutcome.success).toBe(false);
  });
});
