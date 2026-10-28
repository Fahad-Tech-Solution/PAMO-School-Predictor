import { describe, expect, it } from "vitest";

import {
  attemptBucketLabel,
  buildGpaBins,
  countAttempts,
  countIntoBins,
  countOutcomes,
  countResidency,
  GPA_BINS,
  outcomeLabelFromStatus,
  PCE_BINS,
  valueInBin,
} from "@/lib/statistics/bins";

describe("GPA bins", () => {
  it("builds contiguous 0.1 bins from 2.7 to 4.0", () => {
    const bins = buildGpaBins();
    expect(bins[0]?.min).toBe(2.7);
    expect(bins.at(-1)?.max).toBe(4);
    expect(bins.at(-1)?.inclusiveMax).toBe(true);
  });

  it("counts values into bins without inventing data", () => {
    const counts = countIntoBins([2.7, 3.05, 4], GPA_BINS);
    expect(counts.reduce((sum, row) => sum + row.count, 0)).toBe(3);
    expect(valueInBin(4, GPA_BINS.at(-1)!)).toBe(true);
  });
});

describe("PCE bins", () => {
  it("uses uniform 500-hour bands through 10000+", () => {
    expect(PCE_BINS[0]).toMatchObject({ label: "0–500", min: 0, max: 500 });
    expect(PCE_BINS[1]).toMatchObject({
      label: "500–1000",
      min: 500,
      max: 1000,
    });
    expect(PCE_BINS[2]).toMatchObject({
      label: "1000–1500",
      min: 1000,
      max: 1500,
    });
    expect(PCE_BINS[3]).toMatchObject({
      label: "1500–2000",
      min: 1500,
      max: 2000,
    });
    const last = PCE_BINS.at(-1)!;
    expect(last.label).toBe("10000+");
    expect(valueInBin(10_000, last)).toBe(true);
    expect(countIntoBins([10_500], PCE_BINS)[PCE_BINS.length - 1]?.count).toBe(
      1,
    );
    expect(countIntoBins([1250], PCE_BINS).find((b) => b.label === "1000–1500")?.count).toBe(
      1,
    );
  });
});

describe("GPA labels", () => {
  it("labels bins with two decimal places (hundredths)", () => {
    expect(GPA_BINS[0]?.label).toBe("2.70–2.80");
    expect(GPA_BINS.at(-1)?.label).toBe("3.90–4.00");
  });
});

describe("attempts and outcomes", () => {
  it("buckets attempts and labels outcomes", () => {
    expect(attemptBucketLabel(1)).toBe("1st");
    expect(attemptBucketLabel(6)).toBe("6+");
    expect(countAttempts([1, 1, 6])).toEqual(
      expect.arrayContaining([
        { label: "1st", count: 2 },
        { label: "6+", count: 1 },
      ]),
    );
    expect(outcomeLabelFromStatus(null)).toBe("Unknown");
    expect(countOutcomes(["ACCEPTED", null, "WAITLISTED"])).toEqual([
      { label: "Accepted", count: 1 },
      { label: "Not accepted", count: 0 },
      { label: "Waitlisted", count: 1 },
      { label: "Unknown", count: 1 },
    ]);
  });

  it("counts residency without fabricating missing values", () => {
    expect(countResidency(["IN_STATE", "OUT_OF_STATE", "IN_STATE"])).toEqual([
      { label: "In-state", count: 2 },
      { label: "Out-of-state", count: 1 },
    ]);
  });
});
