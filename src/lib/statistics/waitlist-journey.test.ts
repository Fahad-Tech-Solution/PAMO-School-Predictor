import { describe, expect, it } from "vitest";

import { computeWaitlistJourneyStats } from "@/lib/statistics/waitlist-journey";

describe("computeWaitlistJourneyStats", () => {
  it("computes conversion % and average waitlist days", () => {
    const stats = computeWaitlistJourneyStats([
      {
        status: "ACCEPTED",
        waitlistedAt: "2025-10-30T12:00:00.000Z",
        acceptedAt: "2026-08-13T12:00:00.000Z",
      },
      {
        status: "WAITLISTED",
        waitlistedAt: "2025-11-01T12:00:00.000Z",
        acceptedAt: null,
      },
      {
        status: "ACCEPTED",
        waitlistedAt: null,
        acceptedAt: "2025-09-01T12:00:00.000Z",
      },
      {
        status: "NOT_ACCEPTED",
        waitlistedAt: "2025-05-01T12:00:00.000Z",
        acceptedAt: null,
      },
    ]);

    // ever waitlisted: accepted-after, still waitlisted, not-accepted-after-waitlist
    expect(stats.everWaitlisted).toBe(3);
    expect(stats.acceptedAfterWaitlist).toBe(1);
    expect(stats.conversionPct).toBeCloseTo(100 / 3);
    expect(stats.avgDaysToAcceptance).toBe(287);
    expect(stats.avgDaysSampleSize).toBe(1);
  });

  it("returns empty metrics when nobody was waitlisted", () => {
    expect(
      computeWaitlistJourneyStats([
        { status: "ACCEPTED", waitlistedAt: null, acceptedAt: null },
      ]),
    ).toEqual({
      everWaitlisted: 0,
      acceptedAfterWaitlist: 0,
      conversionPct: null,
      avgDaysToAcceptance: null,
      avgDaysSampleSize: 0,
    });
  });
});
