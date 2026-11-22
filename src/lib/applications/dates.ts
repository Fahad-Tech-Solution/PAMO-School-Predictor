/** Date-only helpers for interview/results/waitlist/accepted form fields (YYYY-MM-DD). */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Format a stored timestamp for `<input type="date">`. */
export function formatDateInput(value: Date | string | null | undefined): string {
  if (value == null) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Display a date-only value in en-US (no time). */
export function formatDateOnly(value: Date | string | null | undefined): string {
  if (value == null) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Parse YYYY-MM-DD to a UTC noon Date (avoids timezone day-shift for date-only fields).
 * Returns null for blank input.
 */
export function parseDateOnlyInput(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!DATE_ONLY.test(trimmed)) return null;
  const date = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function isValidDateOnlyInput(raw: string): boolean {
  return parseDateOnlyInput(raw) != null;
}
