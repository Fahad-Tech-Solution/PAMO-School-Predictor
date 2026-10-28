"use client";

import {
  Cancel01Icon,
  SearchIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  getSchoolsByIdsAction,
  listSchoolsCatalogAction,
} from "@/actions/schools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStateLabel } from "@/lib/geo/us-states";
import type { SchoolSearchRow } from "@/lib/schools/queries";
import { cn } from "@/lib/utils";

type SharedProps = {
  name?: string;
  label?: string;
  disabled?: boolean;
  /** When true, catalog includes inactive schools (historical edit/filter). */
  includeInactive?: boolean;
};

type SingleProps = SharedProps & {
  multiple?: false;
  value?: string | null;
  defaultValue?: string | null;
  defaultLabel?: string | null;
  onChange?: (schoolId: string | null) => void;
};

type MultiProps = SharedProps & {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onChange?: (schoolIds: string[]) => void;
};

type SchoolSelectorProps = SingleProps | MultiProps;

type CatalogCache = {
  includeInactive: boolean;
  promise: Promise<SchoolSearchRow[]>;
};

/** One shared in-flight/resolved catalog per includeInactive mode (page lifetime). */
const catalogCaches = new Map<string, CatalogCache>();

/** Dispatched after school create/update/activate so directory + selectors refetch. */
export const SCHOOLS_CATALOG_INVALIDATE_EVENT =
  "pamo:schools-catalog-invalidate";

/** Drop client catalog cache after create/update/activate so selectors refetch. */
export function invalidateSchoolCatalogClientCache(): void {
  catalogCaches.clear();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SCHOOLS_CATALOG_INVALIDATE_EVENT));
  }
}

function loadCatalog(includeInactive: boolean): Promise<SchoolSearchRow[]> {
  const key = includeInactive ? "all" : "active";
  const existing = catalogCaches.get(key);
  if (existing) return existing.promise;

  const promise = listSchoolsCatalogAction({ includeInactive }).catch(
    (error) => {
      catalogCaches.delete(key);
      throw error;
    },
  );
  catalogCaches.set(key, { includeInactive, promise });
  return promise;
}

function filterSchools(
  rows: SchoolSearchRow[],
  query: string,
): SchoolSearchRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;

  return rows.filter((school) => {
    const stateName = getStateLabel(school.state).toLowerCase();
    return (
      school.name.toLowerCase().includes(needle) ||
      school.state.toLowerCase().includes(needle) ||
      stateName.includes(needle)
    );
  });
}

function schoolLabel(school: SchoolSearchRow): string {
  const base = `${school.name} · ${getStateLabel(school.state)}`;
  return school.isActive ? base : `${base} (inactive)`;
}

export function SchoolSelector(props: SchoolSelectorProps) {
  const {
    name = props.multiple ? "schoolIds" : "schoolId",
    label = "School",
    disabled,
    includeInactive = false,
  } = props;
  const multiple = props.multiple === true;

  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<SchoolSearchRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pending, startTransition] = useTransition();

  const [internalSingle, setInternalSingle] = useState<string | null>(
    !multiple ? (props.defaultValue ?? null) : null,
  );
  const [internalMulti, setInternalMulti] = useState<string[]>(
    multiple ? (props.defaultValue ?? []) : [],
  );
  const [singleLabel, setSingleLabel] = useState<string | null>(
    !multiple ? (props.defaultLabel ?? null) : null,
  );
  const [selectedMeta, setSelectedMeta] = useState<
    Record<string, SchoolSearchRow>
  >({});

  const selectedSingle =
    !multiple && props.value !== undefined ? props.value : internalSingle;
  const selectedMulti =
    multiple && props.value !== undefined ? props.value : internalMulti;
  const selectedIds = multiple
    ? selectedMulti
    : selectedSingle
      ? [selectedSingle]
      : [];

  // Instant local filter — same idea as StateCombobox / filterStates.
  const options = useMemo(
    () => (catalog ? filterSchools(catalog, query) : []),
    [catalog, query],
  );

  function ensureCatalogLoaded() {
    if (catalog) return;
    startTransition(async () => {
      try {
        const rows = await loadCatalog(includeInactive);
        setCatalog(rows);
        setLoadError(false);
      } catch {
        setLoadError(true);
        setCatalog([]);
      }
    });
  }

  // Prefetch once on mount so the first open is usually already warm.
  useEffect(() => {
    ensureCatalogLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per includeInactive
  }, [includeInactive]);

  // After school create/update/activate, drop local rows and reload.
  useEffect(() => {
    const onInvalidate = () => {
      setCatalog(null);
      startTransition(async () => {
        try {
          const rows = await loadCatalog(includeInactive);
          setCatalog(rows);
          setLoadError(false);
        } catch {
          setLoadError(true);
          setCatalog([]);
        }
      });
    };
    window.addEventListener(SCHOOLS_CATALOG_INVALIDATE_EVENT, onInvalidate);
    return () => {
      window.removeEventListener(SCHOOLS_CATALOG_INVALIDATE_EVENT, onInvalidate);
    };
  }, [includeInactive]);

  // Resolve labels for pre-selected ids (including inactive historical schools).
  useEffect(() => {
    if (selectedIds.length === 0) return;
    const missing = selectedIds.filter((id) => !selectedMeta[id]);
    if (missing.length === 0) return;

    // Prefer labels from the local catalog when available.
    if (catalog) {
      const fromCatalog: Record<string, SchoolSearchRow> = {};
      let foundAll = true;
      for (const id of missing) {
        const row = catalog.find((school) => school.id === id);
        if (row) fromCatalog[id] = row;
        else foundAll = false;
      }
      if (Object.keys(fromCatalog).length > 0) {
        setSelectedMeta((prev) => ({ ...prev, ...fromCatalog }));
        if (!multiple && fromCatalog[missing[0]!] && !singleLabel) {
          setSingleLabel(schoolLabel(fromCatalog[missing[0]!]!));
        }
      }
      if (foundAll) return;
    }

    let cancelled = false;
    const stillMissing = catalog
      ? missing.filter((id) => !catalog.some((school) => school.id === id))
      : missing;

    if (stillMissing.length === 0) return;

    void getSchoolsByIdsAction(stillMissing).then((rows) => {
      if (cancelled) return;
      setSelectedMeta((prev) => {
        const next = { ...prev };
        for (const row of rows) next[row.id] = row;
        return next;
      });
      if (!multiple && rows[0] && !singleLabel) {
        setSingleLabel(schoolLabel(rows[0]));
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resolve when selection ids change
  }, [selectedIds.join("|"), catalog]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(school: SchoolSearchRow) {
    setSelectedMeta((prev) => ({ ...prev, [school.id]: school }));

    if (multiple) {
      const exists = selectedMulti.includes(school.id);
      const next = exists
        ? selectedMulti.filter((id) => id !== school.id)
        : [...selectedMulti, school.id];
      setInternalMulti(next);
      props.onChange?.(next);
      setQuery("");
      return;
    }

    setInternalSingle(school.id);
    setSingleLabel(schoolLabel(school));
    props.onChange?.(school.id);
    setOpen(false);
    setQuery("");
  }

  function remove(id: string) {
    if (multiple) {
      const next = selectedMulti.filter((item) => item !== id);
      setInternalMulti(next);
      props.onChange?.(next);
      return;
    }
    setInternalSingle(null);
    setSingleLabel(null);
    props.onChange?.(null);
  }

  const selectedSchools = selectedIds
    .map((id) => selectedMeta[id])
    .filter(Boolean) as SchoolSearchRow[];

  return (
    <div ref={rootRef} className={cn("space-y-1.5", open && "relative z-[80]")}>
      {label ? <Label>{label}</Label> : null}

      {multiple ? (
        selectedIds.map((id) => (
          <input key={id} type="hidden" name={name} value={id} />
        ))
      ) : (
        <input type="hidden" name={name} value={selectedSingle ?? ""} />
      )}

      <div className="relative min-w-0">
        <HugeiconsIcon
          icon={SearchIcon}
          size={16}
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          disabled={disabled}
          placeholder={
            multiple
              ? "Search and select schools…"
              : "Search schools by name…"
          }
          className="pl-9"
          onFocus={() => {
            setOpen(true);
            ensureCatalogLoaded();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            ensureCatalogLoaded();
          }}
          aria-controls={listId}
          aria-expanded={open}
          role="combobox"
        />

        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            className="absolute z-[80] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md"
          >
            {pending && !catalog ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Loading schools…
              </p>
            ) : loadError ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                Unable to load schools.
              </p>
            ) : options.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No schools found.
              </p>
            ) : (
              options.map((school) => {
                const isSelected = selectedIds.includes(school.id);
                return (
                  <button
                    key={school.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted",
                      isSelected && "bg-secondary/20",
                    )}
                    onClick={() => toggle(school)}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          isSelected && "text-secondary-foreground",
                        )}
                      >
                        {school.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {getStateLabel(school.state)}
                        {school.requiresGre
                          ? " · GRE required"
                          : " · GRE not required"}
                        {!school.isActive ? " · Inactive" : ""}
                      </span>
                    </span>
                    {isSelected ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-secondary">
                        <span className="text-xs font-medium">Selected</span>
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          size={16}
                          strokeWidth={2.2}
                        />
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {includeInactive
          ? "All schools load once, then filter instantly (includes inactive)."
          : "All active schools load once, then filter instantly — no search API."}
      </p>

      {multiple && selectedSchools.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedSchools.map((school) => (
            <span
              key={school.id}
              className="inline-flex items-center gap-1 rounded-md bg-secondary/20 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-secondary/40"
            >
              <HugeiconsIcon
                icon={Tick02Icon}
                size={12}
                strokeWidth={2.2}
                className="text-secondary"
              />
              {school.name} ({school.state})
              {!school.isActive ? " · inactive" : ""}
              <button
                type="button"
                aria-label={`Remove ${school.name}`}
                className="rounded-sm p-0.5 hover:bg-secondary/30"
                onClick={() => remove(school.id)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {!multiple && selectedSingle && (singleLabel || selectedMeta[selectedSingle]) ? (
        <div className="flex items-center gap-2 rounded-md border border-secondary bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          <HugeiconsIcon
            icon={Tick02Icon}
            size={16}
            strokeWidth={2.2}
            className="shrink-0"
          />
          <span className="min-w-0 flex-1 truncate font-medium">
            {singleLabel ??
              (selectedMeta[selectedSingle]
                ? schoolLabel(selectedMeta[selectedSingle]!)
                : selectedSingle)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            className="hover:bg-secondary-foreground/10"
            onClick={() => remove(selectedSingle)}
            aria-label="Clear school"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
