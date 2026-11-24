/** Admin-facing display: "Last, First" or fallbacks for legacy blank names. */

export function formatApplicantName(options: {
  lastName?: string | null;
  firstName?: string | null;
}): string | null {
  const last = options.lastName?.trim() ?? "";
  const first = options.firstName?.trim() ?? "";
  if (last && first) return `${last}, ${first}`;
  if (last) return last;
  if (first) return first;
  return null;
}

/** Label with home-state fallback when name is blank (detail links). */
export function formatApplicantLabel(options: {
  lastName?: string | null;
  firstName?: string | null;
  homeStateLabel: string;
}): string {
  const name = formatApplicantName(options);
  return name ?? options.homeStateLabel;
}
