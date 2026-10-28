"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import { listSchoolsCatalogAction } from "@/actions/schools";
import { SCHOOLS_CATALOG_INVALIDATE_EVENT } from "@/components/schools/school-selector";
import { StateCombobox } from "@/components/schools/state-combobox";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStateLabel } from "@/lib/geo/us-states";
import type { SchoolSearchRow } from "@/lib/schools/queries";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export type SchoolsDirectoryFilters = {
  q: string;
  states: string[];
  gre: "all" | "required" | "not_required";
  status: "active" | "inactive" | "all";
  page: number;
};

function syncUrl(filters: SchoolsDirectoryFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.states.length > 0) params.set("state", filters.states.join(","));
  if (filters.gre !== "all") params.set("gre", filters.gre);
  if (filters.status !== "active") params.set("status", filters.status);
  if (filters.page > 1) params.set("page", String(filters.page));

  const qs = params.toString();
  const next = qs ? `/schools?${qs}` : "/schools";
  const current = `${window.location.pathname}${window.location.search}`;
  if (current !== next) {
    window.history.replaceState(null, "", next);
  }
}

function filterCatalog(
  schools: SchoolSearchRow[],
  filters: Omit<SchoolsDirectoryFilters, "page">,
): SchoolSearchRow[] {
  const needle = filters.q.trim().toLowerCase();

  return schools.filter((school) => {
    if (filters.status === "active" && !school.isActive) return false;
    if (filters.status === "inactive" && school.isActive) return false;

    if (filters.gre === "required" && !school.requiresGre) return false;
    if (filters.gre === "not_required" && school.requiresGre) return false;

    if (
      filters.states.length > 0 &&
      !filters.states.includes(school.state)
    ) {
      return false;
    }

    if (!needle) return true;

    const stateName = getStateLabel(school.state).toLowerCase();
    return (
      school.name.toLowerCase().includes(needle) ||
      school.state.toLowerCase().includes(needle) ||
      stateName.includes(needle)
    );
  });
}

export function SchoolsDirectory({
  initialSchools,
  initialFilters,
  isAdmin,
}: {
  initialSchools: SchoolSearchRow[];
  initialFilters: SchoolsDirectoryFilters;
  isAdmin: boolean;
}) {
  const [schools, setSchools] = useState(initialSchools);
  const [q, setQ] = useState(initialFilters.q);
  const [states, setStates] = useState(initialFilters.states);
  const [gre, setGre] = useState(initialFilters.gre);
  const [status, setStatus] = useState(initialFilters.status);
  const [page, setPage] = useState(initialFilters.page);
  const [pending, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      try {
        const rows = await listSchoolsCatalogAction({ includeInactive: true });
        setSchools(rows);
      } catch {
        // Keep current catalog on failure.
      }
    });
  }, []);

  // Refetch after create/edit/activate (same event as school selectors).
  useEffect(() => {
    const onInvalidate = () => reload();
    window.addEventListener(SCHOOLS_CATALOG_INVALIDATE_EVENT, onInvalidate);
    return () => {
      window.removeEventListener(SCHOOLS_CATALOG_INVALIDATE_EVENT, onInvalidate);
    };
  }, [reload]);

  const filtered = useMemo(
    () => filterCatalog(schools, { q, states, gre, status }),
    [schools, q, states, gre, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  // Keep URL shareable without triggering a server round-trip.
  useEffect(() => {
    syncUrl({ q, states, gre, status, page: safePage });
  }, [q, states, gre, status, safePage]);

  // If filters shrink the result set, snap page back into range.
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  function setFilterPage(next: number) {
    setPage(Math.max(1, next));
  }

  function updateFilters(
    patch: Partial<Omit<SchoolsDirectoryFilters, "page">>,
  ) {
    if (patch.q !== undefined) setQ(patch.q);
    if (patch.states !== undefined) setStates(patch.states);
    if (patch.gre !== undefined) setGre(patch.gre);
    if (patch.status !== undefined) setStatus(patch.status);
    setPage(1);
  }

  function resetFilters() {
    setQ("");
    setStates([]);
    setGre("all");
    setStatus("active");
    setPage(1);
  }

  const activeFilterLabels: string[] = [];
  if (q.trim()) activeFilterLabels.push(`Name: “${q.trim()}”`);
  if (states.length > 0) {
    activeFilterLabels.push(
      `State: ${states.map((code) => getStateLabel(code)).join(", ")}`,
    );
  }
  if (gre !== "all") {
    activeFilterLabels.push(
      gre === "required" ? "GRE: required" : "GRE: not required",
    );
  }
  if (status !== "active") {
    activeFilterLabels.push(
      status === "inactive" ? "Status: inactive" : "Status: all",
    );
  }
  const hasNonDefaultFilters = activeFilterLabels.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-lg border border-border bg-white p-4 md:grid-cols-5">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="schools-q">Search name</Label>
          <Input
            id="schools-q"
            value={q}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Case-insensitive school name"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>States</Label>
          <StateCombobox
            multiple
            name="state"
            value={states}
            onChange={(codes) => updateFilters({ states: codes })}
            placeholder="Select one or more states"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="schools-gre">GRE</Label>
          <select
            id="schools-gre"
            value={gre}
            onChange={(e) =>
              updateFilters({
                gre: e.target.value as SchoolsDirectoryFilters["gre"],
              })
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="all">All</option>
            <option value="required">Required</option>
            <option value="not_required">Not required</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="schools-status">Status</Label>
          <select
            id="schools-status"
            value={status}
            onChange={(e) =>
              updateFilters({
                status: e.target.value as SchoolsDirectoryFilters["status"],
              })
            }
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-2 md:col-span-5">
          <Button type="button" variant="outline" onClick={resetFilters}>
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={reload}
          >
            {pending ? "Refreshing…" : "Refresh list"}
          </Button>
          <p className="text-xs text-muted-foreground md:ml-auto">
            Catalog loads once; filters are instant (no DB per change).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length === 0
            ? "No schools match these filters."
            : `${filtered.length} school${filtered.length === 1 ? "" : "s"} match`}
          {hasNonDefaultFilters ? (
            <span className="text-foreground">
              {" "}
              · {activeFilterLabels.join(" · ")}
            </span>
          ) : (
            <span> · showing active by default</span>
          )}
        </p>
      </div>

      <PaginationBar
        safePage={safePage}
        totalPages={totalPages}
        onPageChange={setFilterPage}
      />

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">State</th>
              <th className="px-4 py-3 font-medium">GRE</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No schools match these filters.
                </td>
              </tr>
            ) : (
              pageItems.map((school) => (
                <tr
                  key={school.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link
                      href={`/schools/${school.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {school.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {getStateLabel(school.state)}
                  </td>
                  <td className="px-4 py-3">
                    {school.requiresGre ? "Required" : "Not required"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        school.isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {school.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <div className="flex justify-end">
                        <Link
                          href={`/schools/${school.id}`}
                          className={cn(
                            buttonVariants({ variant: "default", size: "sm" }),
                          )}
                        >
                          Edit
                        </Link>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        safePage={safePage}
        totalPages={totalPages}
        onPageChange={setFilterPage}
      />
    </div>
  );
}

function PaginationBar({
  safePage,
  totalPages,
  onPageChange,
}: {
  safePage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Page {safePage} of {totalPages}
      </p>
      {totalPages > 1 ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
