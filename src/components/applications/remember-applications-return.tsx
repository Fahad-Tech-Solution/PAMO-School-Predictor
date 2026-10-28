"use client";

import { RememberListReturn } from "@/components/navigation/remember-list-return";
import { APPLICATIONS_RETURN_KEY } from "@/components/navigation/list-return";

export function RememberApplicationsReturn() {
  return (
    <RememberListReturn
      basePath="/applications"
      storageKey={APPLICATIONS_RETURN_KEY}
    />
  );
}
