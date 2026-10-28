"use client";

import { RememberListReturn } from "@/components/navigation/remember-list-return";
import { SCHOOLS_RETURN_KEY } from "@/components/navigation/list-return";

export function RememberSchoolsReturn() {
  return (
    <RememberListReturn basePath="/schools" storageKey={SCHOOLS_RETURN_KEY} />
  );
}
