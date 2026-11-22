import {
  isAcceptedAfterWaitlist,
  waitlistToAcceptanceDays,
  wasEverWaitlisted,
  type JourneyDates,
} from "@/lib/applications/journey";

export type WaitlistJourneyStats = {
  /** Applications that were waitlisted (stamp or current WAITLISTED status). */
  everWaitlisted: number;
  /** Accepted applications that also have a waitlisted stamp. */
  acceptedAfterWaitlist: number;
  /** acceptedAfterWaitlist / everWaitlisted × 100; null when no waitlist cohort. */
  conversionPct: number | null;
  /** Mean UTC days waitlisted → accepted (both stamps required). */
  avgDaysToAcceptance: number | null;
  avgDaysSampleSize: number;
};

export const emptyWaitlistJourney: WaitlistJourneyStats = {
  everWaitlisted: 0,
  acceptedAfterWaitlist: 0,
  conversionPct: null,
  avgDaysToAcceptance: null,
  avgDaysSampleSize: 0,
};

export function computeWaitlistJourneyStats(
  rows: JourneyDates[],
): WaitlistJourneyStats {
  let everWaitlisted = 0;
  let acceptedAfterWaitlist = 0;
  const daySamples: number[] = [];

  for (const row of rows) {
    if (wasEverWaitlisted(row)) everWaitlisted += 1;
    if (isAcceptedAfterWaitlist(row)) {
      acceptedAfterWaitlist += 1;
      const days = waitlistToAcceptanceDays(row.waitlistedAt, row.acceptedAt);
      if (days != null) daySamples.push(days);
    }
  }

  return {
    everWaitlisted,
    acceptedAfterWaitlist,
    conversionPct:
      everWaitlisted > 0
        ? (acceptedAfterWaitlist / everWaitlisted) * 100
        : null,
    avgDaysToAcceptance:
      daySamples.length > 0
        ? daySamples.reduce((sum, n) => sum + n, 0) / daySamples.length
        : null,
    avgDaysSampleSize: daySamples.length,
  };
}
