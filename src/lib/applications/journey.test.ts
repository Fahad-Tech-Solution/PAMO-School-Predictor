import { describe, expect, it } from "vitest";

import {
  buildTimelineEvents,
  isAcceptedAfterWaitlist,
  journeyStatusLabel,
  waitlistToAcceptanceDays,
  wasEverWaitlisted,
} from "@/lib/applications/journey";

describe("waitlist journey", () => {
  it("detects ever-waitlisted and accepted-after-waitlist", () => {
    expect(
      wasEverWaitlisted({ status: "WAITLISTED", waitlistedAt: null }),
    ).toBe(true);
    expect(
      wasEverWaitlisted({
        status: "ACCEPTED",
        waitlistedAt: "2025-10-30T12:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      wasEverWaitlisted({ status: "ACCEPTED", waitlistedAt: null }),
    ).toBe(false);

    expect(
      isAcceptedAfterWaitlist({
        status: "ACCEPTED",
        waitlistedAt: "2025-10-30T12:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      isAcceptedAfterWaitlist({ status: "ACCEPTED", waitlistedAt: null }),
    ).toBe(false);
    expect(
      isAcceptedAfterWaitlist({
        status: "WAITLISTED",
        waitlistedAt: "2025-10-30T12:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("computes waitlist-to-acceptance days and journey label", () => {
    expect(
      waitlistToAcceptanceDays(
        "2025-10-30T12:00:00.000Z",
        "2026-08-13T12:00:00.000Z",
      ),
    ).toBe(287);
    expect(
      waitlistToAcceptanceDays("2025-10-30T12:00:00.000Z", null),
    ).toBeNull();
    expect(
      journeyStatusLabel({
        status: "ACCEPTED",
        waitlistedAt: "2025-10-30T12:00:00.000Z",
      }),
    ).toBe("Accepted after waitlist");
    expect(
      journeyStatusLabel({ status: "ACCEPTED", waitlistedAt: null }),
    ).toBe("Accepted");
  });

  it("builds a sorted timeline of present dates", () => {
    const events = buildTimelineEvents({
      status: "ACCEPTED",
      interviewAt: "2025-10-19T12:00:00.000Z",
      resultsAt: "2025-10-30T12:00:00.000Z",
      waitlistedAt: "2025-10-30T12:00:00.000Z",
      acceptedAt: "2026-08-13T12:00:00.000Z",
    });
    expect(events.map((e) => e.key)).toEqual([
      "interview",
      "results",
      "waitlisted",
      "accepted",
    ]);
    expect(events.at(-1)?.label).toBe("Accepted (after waitlist)");
  });
});
