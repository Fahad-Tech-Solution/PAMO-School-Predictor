import type { Application } from "@/db/schema";

export type ApplicationStatusValue =
  | "ACCEPTED"
  | "NOT_ACCEPTED"
  | "WAITLISTED"
  | null;

export function statusToFormValue(
  status: Application["status"],
): "UNKNOWN" | "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED" {
  if (!status) return "UNKNOWN";
  return status;
}

export function formValueToStatus(
  value: "UNKNOWN" | "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED",
): ApplicationStatusValue {
  if (value === "UNKNOWN") return null;
  return value;
}

export function statusLabel(status: ApplicationStatusValue): string {
  if (!status) return "Unknown";
  switch (status) {
    case "ACCEPTED":
      return "Accepted";
    case "NOT_ACCEPTED":
      return "Not accepted";
    case "WAITLISTED":
      return "Waitlisted";
  }
}
