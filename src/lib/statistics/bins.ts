export type ChartDatum = {
  label: string;
  count: number;
};

/** GPA range for product: 2.70 → 4.00, frequency bins of 0.10. */
export const GPA_MIN = 2.7;
export const GPA_MAX = 4.0;
export const GPA_STEP = 0.1;

export type NumericBin = {
  label: string;
  min: number;
  /** Exclusive upper bound, except the last GPA bin which includes 4.00. */
  max: number;
  inclusiveMax: boolean;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** GPA axis / average display precision — hundredths (e.g. 3.20). */
export const GPA_DISPLAY_DIGITS = 2;

export function buildGpaBins(): NumericBin[] {
  const bins: NumericBin[] = [];
  for (let min = GPA_MIN; min < GPA_MAX; min = round1(min + GPA_STEP)) {
    const max = round1(min + GPA_STEP);
    const isLast = max >= GPA_MAX;
    bins.push({
      label: isLast
        ? `${min.toFixed(GPA_DISPLAY_DIGITS)}–${GPA_MAX.toFixed(GPA_DISPLAY_DIGITS)}`
        : `${min.toFixed(GPA_DISPLAY_DIGITS)}–${max.toFixed(GPA_DISPLAY_DIGITS)}`,
      min,
      max: isLast ? GPA_MAX : max,
      inclusiveMax: isLast,
    });
  }
  return bins;
}

export const GPA_BINS = buildGpaBins();

/** Fixed PCE step on the chart x-axis (e.g. 500–1000, 1000–1500). */
export const PCE_STEP = 500;
export const PCE_CAP = 10_000;

/** PCE hour ranges in uniform 500-hour bands, then an open-ended 10000+ bin. */
export function buildPceBins(): NumericBin[] {
  const bins: NumericBin[] = [];
  for (let min = 0; min < PCE_CAP; min += PCE_STEP) {
    const max = min + PCE_STEP;
    bins.push({
      label: `${min}–${max}`,
      min,
      max,
      inclusiveMax: false,
    });
  }
  bins.push({
    label: `${PCE_CAP}+`,
    min: PCE_CAP,
    max: Number.POSITIVE_INFINITY,
    inclusiveMax: true,
  });
  return bins;
}

export const PCE_BINS = buildPceBins();

export function valueInBin(value: number, bin: NumericBin): boolean {
  if (value < bin.min) return false;
  if (bin.inclusiveMax) return value <= bin.max;
  return value < bin.max;
}

export function countIntoBins(
  values: number[],
  bins: NumericBin[],
): ChartDatum[] {
  const counts = bins.map(() => 0);
  for (const value of values) {
    const index = bins.findIndex((bin) => valueInBin(value, bin));
    if (index >= 0) counts[index] += 1;
  }
  return bins.map((bin, i) => ({ label: bin.label, count: counts[i]! }));
}

export const ATTEMPT_LABELS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6+",
] as const;

export function attemptBucketLabel(attempt: number): (typeof ATTEMPT_LABELS)[number] {
  if (attempt <= 1) return "1st";
  if (attempt === 2) return "2nd";
  if (attempt === 3) return "3rd";
  if (attempt === 4) return "4th";
  if (attempt === 5) return "5th";
  return "6+";
}

export function countAttempts(attempts: number[]): ChartDatum[] {
  const counts = Object.fromEntries(
    ATTEMPT_LABELS.map((label) => [label, 0]),
  ) as Record<(typeof ATTEMPT_LABELS)[number], number>;

  for (const attempt of attempts) {
    counts[attemptBucketLabel(attempt)] += 1;
  }

  const base = ATTEMPT_LABELS.slice(0, 5).map((label) => ({
    label,
    count: counts[label],
  }));

  if (counts["6+"] > 0) {
    base.push({ label: "6+", count: counts["6+"] });
  }

  return base;
}

export const OUTCOME_LABELS = [
  "Accepted",
  "Not accepted",
  "Waitlisted",
  "Unknown",
] as const;

export type OutcomeLabel = (typeof OUTCOME_LABELS)[number];

export function outcomeLabelFromStatus(
  status: "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED" | null,
): OutcomeLabel {
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

export function countOutcomes(
  statuses: Array<"ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED" | null>,
): ChartDatum[] {
  const counts = Object.fromEntries(
    OUTCOME_LABELS.map((label) => [label, 0]),
  ) as Record<OutcomeLabel, number>;

  for (const status of statuses) {
    counts[outcomeLabelFromStatus(status)] += 1;
  }

  return OUTCOME_LABELS.map((label) => ({
    label,
    count: counts[label],
  }));
}

export const RESIDENCY_LABELS = ["In-state", "Out-of-state"] as const;

export function countResidency(
  residencies: Array<"IN_STATE" | "OUT_OF_STATE">,
): ChartDatum[] {
  let inState = 0;
  let outOfState = 0;
  for (const residency of residencies) {
    if (residency === "IN_STATE") inState += 1;
    else outOfState += 1;
  }
  return [
    { label: "In-state", count: inState },
    { label: "Out-of-state", count: outOfState },
  ];
}
