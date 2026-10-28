export type Residency = "IN_STATE" | "OUT_OF_STATE";

export function deriveResidency(
  homeState: string,
  schoolState: string,
): Residency {
  return homeState === schoolState ? "IN_STATE" : "OUT_OF_STATE";
}

export function residencyLabel(residency: Residency): string {
  return residency === "IN_STATE" ? "In-state" : "Out-of-state";
}
