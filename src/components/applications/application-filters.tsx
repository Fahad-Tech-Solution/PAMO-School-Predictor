"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { signalNavigationStart } from "@/components/layout/navigation-progress";
import { SchoolSelector } from "@/components/schools/school-selector";
import { StateCombobox } from "@/components/schools/state-combobox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm";

/** Batch filter edits into one navigation/DB round-trip. */
const FILTER_DEBOUNCE_MS = 400;

type FiltersState = {
  schoolId: string;
  status: string;
  attempt: string;
  homeStates: string[];
  residency: string;
};

function buildHref(filters: FiltersState): string {
  const params = new URLSearchParams();
  if (filters.schoolId) params.set("schoolId", filters.schoolId);
  if (filters.homeStates.length > 0) {
    params.set("homeState", filters.homeStates.join(","));
  }
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.attempt && filters.attempt !== "all") {
    params.set("attempt", filters.attempt);
  }
  if (filters.residency && filters.residency !== "all") {
    params.set("residency", filters.residency);
  }
  const qs = params.toString();
  return qs ? `/applications?${qs}` : "/applications";
}

function sameFilters(a: FiltersState, b: FiltersState): boolean {
  return (
    a.schoolId === b.schoolId &&
    a.status === b.status &&
    a.attempt === b.attempt &&
    a.residency === b.residency &&
    a.homeStates.join(",") === b.homeStates.join(",")
  );
}

function filtersFromProps(props: {
  schoolId: string;
  status: string;
  attempt: string;
  homeStates: string[];
  residency: string;
}): FiltersState {
  return {
    schoolId: props.schoolId,
    status: props.status,
    attempt: props.attempt,
    homeStates: props.homeStates,
    residency: props.residency,
  };
}

/**
 * Remount key so URL/server param changes (incl. back/forward) reset draft
 * without a props→setState sync effect.
 */
export function applicationFiltersKey(props: {
  schoolId: string;
  status: string;
  attempt: string;
  homeStates: string[];
  residency: string;
}): string {
  return [
    props.schoolId,
    props.status,
    props.attempt,
    props.homeStates.join(","),
    props.residency,
  ].join("|");
}

export function ApplicationFilters({
  schoolId,
  schoolLabel,
  status,
  attempt,
  homeStates,
  residency,
}: {
  schoolId: string;
  schoolLabel: string | null;
  status: string;
  attempt: string;
  homeStates: string[];
  residency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial = filtersFromProps({
    schoolId,
    status,
    attempt,
    homeStates,
    residency,
  });
  const [draft, setDraft] = useState<FiltersState>(initial);
  // Last filters we navigated to (or started from). Not read during render.
  const committed = useRef<FiltersState>(initial);

  // Debounced auto-apply: one list query after the user stops changing filters.
  useEffect(() => {
    if (sameFilters(draft, committed.current)) return;

    const timer = window.setTimeout(() => {
      const href = buildHref(draft);
      committed.current = draft;
      signalNavigationStart();
      startTransition(() => {
        router.push(href);
      });
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, router]);

  function reset() {
    const empty: FiltersState = {
      schoolId: "",
      status: "all",
      attempt: "all",
      homeStates: [],
      residency: "all",
    };
    setDraft(empty);
    committed.current = empty;
    signalNavigationStart();
    startTransition(() => {
      router.push("/applications");
    });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-white p-4 md:grid-cols-3 lg:grid-cols-6">
      <div className="space-y-1.5 lg:col-span-2">
        <Label>School</Label>
        <SchoolSelector
          name="schoolId"
          label=""
          value={draft.schoolId || null}
          defaultLabel={schoolLabel}
          includeInactive
          onChange={(id) =>
            setDraft((prev) => ({ ...prev, schoolId: id ?? "" }))
          }
        />
      </div>
      <div className="space-y-1.5 lg:col-span-2">
        <Label>Home states</Label>
        <StateCombobox
          multiple
          name="homeState"
          value={draft.homeStates}
          onChange={(codes) =>
            setDraft((prev) => ({ ...prev, homeStates: codes }))
          }
          placeholder="Select one or more states"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={draft.status}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, status: e.target.value }))
          }
          className={selectClassName}
        >
          <option value="all">All</option>
          <option value="UNKNOWN">Unknown</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="NOT_ACCEPTED">Not accepted</option>
          <option value="WAITLISTED">Waitlisted</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="attempt">Attempt</Label>
        <select
          id="attempt"
          value={draft.attempt}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, attempt: e.target.value }))
          }
          className={selectClassName}
        >
          <option value="all">All</option>
          <option value="1">1st</option>
          <option value="2">2nd</option>
          <option value="3">3rd</option>
          <option value="4">4th</option>
          <option value="5">5th</option>
          <option value="6plus">6+</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="residency">Residency</Label>
        <select
          id="residency"
          value={draft.residency}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, residency: e.target.value }))
          }
          className={selectClassName}
        >
          <option value="all">All</option>
          <option value="IN_STATE">In-state</option>
          <option value="OUT_OF_STATE">Out-of-state</option>
        </select>
      </div>
      <div className="flex flex-wrap items-end gap-2 md:col-span-3 lg:col-span-6">
        <Button type="button" variant="outline" disabled={pending} onClick={reset}>
          Reset
        </Button>
        <p className="text-xs text-muted-foreground md:ml-auto">
          {pending
            ? "Loading page…"
            : "Filters apply after a short pause (one server query). Rows stay paginated — not loaded all at once."}
        </p>
      </div>
    </div>
  );
}
