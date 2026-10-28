import Link from "next/link";
import { Suspense } from "react";

import { RememberSchoolsReturn } from "@/components/schools/remember-schools-return";
import {
  SchoolsDirectory,
  type SchoolsDirectoryFilters,
} from "@/components/schools/schools-directory";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { parseStateParam } from "@/lib/geo/us-states";
import { listSchoolsForSelector } from "@/lib/schools/queries";
import { cn } from "@/lib/utils";

export const instant = false;

function parseGre(value?: string): SchoolsDirectoryFilters["gre"] {
  if (value === "required" || value === "not_required") return value;
  return "all";
}

function parseStatus(value?: string): SchoolsDirectoryFilters["status"] {
  if (value === "inactive" || value === "all") return value;
  return "active";
}

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    state?: string | string[];
    gre?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  const initialFilters: SchoolsDirectoryFilters = {
    q: params.q?.trim() ?? "",
    states: parseStateParam(params.state),
    gre: parseGre(params.gre),
    status: parseStatus(params.status),
    page: Math.max(1, Number(params.page ?? "1") || 1),
  };

  // Full catalog once (Redis when configured); client filters without DB hits.
  const initialSchools = await listSchoolsForSelector({ includeInactive: true });

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <RememberSchoolsReturn />
      </Suspense>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">Schools</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and manage PA programs by name, state, and GRE requirement.
          </p>
        </div>
        {user.role === "ADMIN" ? (
          <Link
            href="/schools/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Add school
          </Link>
        ) : null}
      </div>

      <SchoolsDirectory
        initialSchools={initialSchools}
        initialFilters={initialFilters}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
