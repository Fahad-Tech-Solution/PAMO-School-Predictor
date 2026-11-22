import type { ApplicationStatusValue } from "@/lib/applications/status";
import { statusLabel } from "@/lib/applications/status";

export type JourneyDates = {
  status: ApplicationStatusValue;
  waitlistedAt: Date | string | null | undefined;
  acceptedAt?: Date | string | null | undefined;
  interviewAt?: Date | string | null | undefined;
  resultsAt?: Date | string | null | undefined;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** True if the applicant was recorded as waitlisted (stamp or current status). */
export function wasEverWaitlisted(row: JourneyDates): boolean {
  return toDate(row.waitlistedAt) != null || row.status === "WAITLISTED";
}

/**
 * Final accepted after a prior waitlist.
 * Requires ACCEPTED status plus a waitlisted stamp (status alone is not enough).
 */
export function isAcceptedAfterWaitlist(row: JourneyDates): boolean {
  return row.status === "ACCEPTED" && toDate(row.waitlistedAt) != null;
}

/** Whole UTC calendar days from waitlist stamp to acceptance stamp. */
export function waitlistToAcceptanceDays(
  waitlistedAt: Date | string | null | undefined,
  acceptedAt: Date | string | null | undefined,
): number | null {
  const start = toDate(waitlistedAt);
  const end = toDate(acceptedAt);
  if (!start || !end) return null;
  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  const days = Math.round((endUtc - startUtc) / 86_400_000);
  if (days < 0) return null;
  return days;
}

/** Status label that surfaces the waitlist → accepted path when present. */
export function journeyStatusLabel(row: JourneyDates): string {
  if (isAcceptedAfterWaitlist(row)) return "Accepted after waitlist";
  return statusLabel(row.status);
}

export type TimelineEvent = {
  key: "interview" | "results" | "waitlisted" | "accepted";
  label: string;
  at: Date;
};

/** Ordered timeline events that have dates (for detail display). */
export function buildTimelineEvents(row: JourneyDates): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const interviewAt = toDate(row.interviewAt);
  const resultsAt = toDate(row.resultsAt);
  const waitlistedAt = toDate(row.waitlistedAt);
  const acceptedAt = toDate(row.acceptedAt);

  if (interviewAt) {
    events.push({ key: "interview", label: "Interview", at: interviewAt });
  }
  if (resultsAt) {
    events.push({ key: "results", label: "Results", at: resultsAt });
  }
  if (waitlistedAt) {
    events.push({ key: "waitlisted", label: "Waitlisted", at: waitlistedAt });
  }
  if (acceptedAt) {
    events.push({
      key: "accepted",
      label: isAcceptedAfterWaitlist(row)
        ? "Accepted (after waitlist)"
        : "Accepted",
      at: acceptedAt,
    });
  }

  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
