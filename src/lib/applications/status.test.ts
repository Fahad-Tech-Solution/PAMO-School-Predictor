import { describe, expect, it } from "vitest";

import {
  formValueToStatus,
  statusLabel,
  statusToFormValue,
} from "@/lib/applications/status";

describe("status mapping", () => {
  it("maps null ↔ UNKNOWN without treating as NOT_ACCEPTED", () => {
    expect(statusToFormValue(null)).toBe("UNKNOWN");
    expect(formValueToStatus("UNKNOWN")).toBeNull();
    expect(statusLabel(null)).toBe("Unknown");
  });

  it("round-trips concrete statuses", () => {
    for (const status of ["ACCEPTED", "NOT_ACCEPTED", "WAITLISTED"] as const) {
      expect(formValueToStatus(statusToFormValue(status))).toBe(status);
      expect(statusLabel(status).length).toBeGreaterThan(0);
    }
  });

  it("keeps WAITLISTED distinct from NOT_ACCEPTED", () => {
    expect(formValueToStatus("WAITLISTED")).toBe("WAITLISTED");
    expect(statusLabel("WAITLISTED")).toBe("Waitlisted");
    expect(statusLabel("NOT_ACCEPTED")).toBe("Not accepted");
  });
});
