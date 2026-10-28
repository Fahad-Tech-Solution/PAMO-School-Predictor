/**
 * Residency is derived, never stored permanently on applications.
 * Same applicant can be in-state for one school and out-of-state for another.
 *
 * Prefer `deriveResidency` from `@/lib/applications/residency` in new code.
 */
export function getResidency(
  applicantHomeState: string,
  schoolState: string,
): "IN_STATE" | "OUT_OF_STATE" {
  return applicantHomeState.trim().toUpperCase() ===
    schoolState.trim().toUpperCase()
    ? "IN_STATE"
    : "OUT_OF_STATE";
}
