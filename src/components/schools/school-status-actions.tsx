"use client";

import { useTransition } from "react";

import { setSchoolActive } from "@/actions/schools";
import { invalidateSchoolCatalogClientCache } from "@/components/schools/school-selector";
import { Button } from "@/components/ui/button";

export function SchoolStatusActions({
  schoolId,
  isActive,
}: {
  schoolId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={isActive ? "outline" : "default"}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setSchoolActive(schoolId, !isActive);
          invalidateSchoolCatalogClientCache();
        });
      }}
    >
      {pending
        ? "Updating…"
        : isActive
          ? "Deactivate school"
          : "Reactivate school"}
    </Button>
  );
}
