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

/**
 * List/detail label for admin lookup.
 * Blank names show as "Unnamed · {home state}" so the link is clearly a person record.
 */
export function formatApplicantLabel(options: {
  lastName?: string | null;
  firstName?: string | null;
  homeStateLabel: string;
}): string {
  const name = formatApplicantName(options);
  if (name) return name;
  return `Unnamed · ${options.homeStateLabel}`;
}
