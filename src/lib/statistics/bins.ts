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

/** Combined Verbal+Quant GRE total range. */
export const GRE_MIN = 270;
export const GRE_MAX = 330;
/** Fixed GRE step on the chart x-axis (e.g. 270–275, 275–280). */
export const GRE_STEP = 5;

/** GRE score ranges in uniform 5-point bands from 270 through 330. */
export function buildGreBins(): NumericBin[] {
  const bins: NumericBin[] = [];
  for (let min = GRE_MIN; min < GRE_MAX; min += GRE_STEP) {
    const max = min + GRE_STEP;
    const isLast = max >= GRE_MAX;
    bins.push({
      label: `${min}–${max}`,
      min,
      max: isLast ? GRE_MAX : max,
      inclusiveMax: isLast,
    });
  }
  return bins;
}

export const GRE_BINS = buildGreBins();

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

/** Max contiguous months before falling back to sparse (count-only) months. */
export const DATE_MONTH_CONTIGUOUS_CAP = 48;

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** UTC year-month key (`YYYY-MM`) for date-only timestamps. */
export function monthKeyFromDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthLabel(key: string): string {
  const [yearPart, monthPart] = key.split("-");
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return key;
  return `${MONTH_SHORT[monthIndex]} ${year}`;
}

function parseMonthKey(key: string): { year: number; monthIndex: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
}

function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

function* iterateMonthKeys(start: string, end: string): Generator<string> {
  const from = parseMonthKey(start);
  const to = parseMonthKey(end);
  if (!from || !to) return;

  let year = from.year;
  let monthIndex = from.monthIndex;
  while (year < to.year || (year === to.year && monthIndex <= to.monthIndex)) {
    yield `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
  }
}

function monthSpanCount(start: string, end: string): number {
  const from = parseMonthKey(start);
  const to = parseMonthKey(end);
  if (!from || !to) return 0;
  return (to.year - from.year) * 12 + (to.monthIndex - from.monthIndex) + 1;
}

/**
 * Count dates by UTC calendar month.
 * Fills empty months between min and max when the span is within
 * {@link DATE_MONTH_CONTIGUOUS_CAP}; otherwise returns sparse months with counts.
 */
export function countByMonth(dates: Date[]): ChartDatum[] {
  if (dates.length === 0) return [];

  const counts = new Map<string, number>();
  for (const date of dates) {
    if (Number.isNaN(date.getTime())) continue;
    const key = monthKeyFromDate(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (counts.size === 0) return [];

  const keys = [...counts.keys()].sort(compareMonthKeys);
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  const span = monthSpanCount(first, last);

  const orderedKeys =
    span > 0 && span <= DATE_MONTH_CONTIGUOUS_CAP
      ? [...iterateMonthKeys(first, last)]
      : keys;

  return orderedKeys.map((key) => ({
    label: formatMonthLabel(key),
    count: counts.get(key) ?? 0,
  }));
}
