/** Date-only helpers for interview/results/waitlist/accepted form fields. */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})(?:T|$)/;
/** American form entry: M/D/YYYY or MM/DD/YYYY. */
const US_DATE = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})$/;

/** Format a stored timestamp for American form inputs (mm/dd/yyyy). */
export function formatDateInput(value: Date | string | null | undefined): string {
  if (value == null) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const ymd = date.toISOString().slice(0, 10);
  const [year, month, day] = ymd.split("-");
  if (!year || !month || !day) return "";
  return `${month}/${day}/${year}`;
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

/**
 * Parse American mm/dd/yyyy (or m/d/yyyy) to a UTC noon Date.
 * Rejects impossible calendar days (e.g. 02/31/2026).
 */
export function parseUsDateInput(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = US_DATE.exec(trimmed);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = parseDateOnlyInput(iso);
  if (!date) return null;

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Coerce form strings (mm/dd/yyyy or YYYY-MM-DD), ISO timestamps, or Date
 * instances into a UTC-noon date-only Date.
 */
export function coerceDateOnly(value: unknown): Date | null {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return parseDateOnlyInput(value.toISOString().slice(0, 10));
  }

  if (typeof value !== "string" && typeof value !== "number") return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const fromUs = parseUsDateInput(raw);
  if (fromUs) return fromUs;

  const fromDateOnly = parseDateOnlyInput(raw);
  if (fromDateOnly) return fromDateOnly;

  const isoMatch = ISO_DATE_PREFIX.exec(raw);
  if (isoMatch?.[1]) {
    return parseDateOnlyInput(isoMatch[1]);
  }

  return null;
}

export function isValidDateOnlyInput(raw: string): boolean {
  return coerceDateOnly(raw) != null;
}
