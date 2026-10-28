/** Shared display helpers for school statistics charts. */

export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

export function formatPercent(part: number, total: number): string {
  return `${Math.round(percentOf(part, total))}%`;
}

export function formatAverage(
  value: number | null,
  digits = 2,
): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value.toFixed(digits);
}

export function formatHours(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value).toLocaleString("en-US");
}

/** Attach 0–100 share for summaries. Named `sharePct` so it does not clash with Recharts' 0–1 `percent`. */
export function withPercents<T extends { label: string; count: number }>(
  data: T[],
): Array<T & { sharePct: number }> {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  return data.map((row) => ({
    ...row,
    sharePct: percentOf(row.count, total),
  }));
}
