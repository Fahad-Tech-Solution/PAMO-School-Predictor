import { GPA_MAX, GPA_MIN, PCE_CAP } from "@/lib/predictor/config";

/** Map GPA in [2.7, 4.0] to [0, 1]. Out-of-range values are clamped. */
export function normalizeGpa(gpa: number): number {
  const clamped = Math.min(GPA_MAX, Math.max(GPA_MIN, gpa));
  return (clamped - GPA_MIN) / (GPA_MAX - GPA_MIN);
}

/** Map PCE hours to [0, 1] with an upper cap so raw scale does not dominate. */
export function normalizePce(hours: number): number {
  const clamped = Math.min(PCE_CAP, Math.max(0, hours));
  return clamped / PCE_CAP;
}

export function parseOptionalNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
