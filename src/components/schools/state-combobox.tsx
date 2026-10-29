"use client";

import { ArrowDown01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  filterStates,
  getStateLabel,
  parseStateParam,
} from "@/lib/geo/us-states";
import { cn } from "@/lib/utils";

type SingleProps = {
  multiple?: false;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

type MultiProps = {
  multiple: true;
  name: string;
  value?: string[];
  defaultValue?: string[];
  onChange?: (codes: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

type StateComboboxProps = SingleProps | MultiProps;

function normalizeCodes(codes: string[]): string[] {
  return parseStateParam(codes.join(","));
}

export function StateCombobox(props: StateComboboxProps) {
  const { name, disabled, placeholder = "Search state…", id } = props;
  const multiple = props.multiple === true;

  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const [internalSingle, setInternalSingle] = useState(
    !multiple ? (props.defaultValue ?? "") : "",
  );
  const [internalMulti, setInternalMulti] = useState<string[]>(
    multiple ? normalizeCodes(props.defaultValue ?? []) : [],
  );

  const selectedSingle =
    !multiple && props.value !== undefined ? props.value : internalSingle;
  const selectedMulti =
    multiple && props.value !== undefined
      ? normalizeCodes(props.value)
      : internalMulti;

  const selectedCodes = multiple
    ? selectedMulti
    : selectedSingle
      ? [selectedSingle]
      : [];

  const options = useMemo(() => filterStates(query), [query]);

  useEffect(() => {
    if (!open || options.length === 0) return;
    optionRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight, open, options.length]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onDocKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    // Capture phase so outside clicks close even if children stop bubbling.
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [open]);

  function setMulti(next: string[]) {
    const codes = normalizeCodes(next);
    setInternalMulti(codes);
    if (multiple) props.onChange?.(codes);
  }

  function toggle(code: string) {
    if (multiple) {
      const exists = selectedMulti.includes(code);
      setMulti(
        exists
          ? selectedMulti.filter((item) => item !== code)
          : [...selectedMulti, code],
      );
      setQuery("");
      return;
    }

    setInternalSingle(code);
    props.onChange?.(code);
    setOpen(false);
    setQuery("");
  }

  function remove(code: string) {
    if (multiple) {
      setMulti(selectedMulti.filter((item) => item !== code));
      return;
    }
    setInternalSingle("");
    props.onChange?.("");
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || options.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => Math.min(index + 1, options.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = options[highlight] ?? options[0];
      if (option) toggle(option.code);
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative space-y-2", open && "z-[80]")}
    >
      {multiple ? (
        <input type="hidden" name={name} value={selectedMulti.join(",")} />
      ) : (
        <input type="hidden" name={name} value={selectedSingle} />
      )}

      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            selectedCodes.length === 0 && "text-muted-foreground",
          )}
        >
          {selectedCodes.length === 0
            ? placeholder
            : multiple
              ? `${selectedCodes.length} state${selectedCodes.length === 1 ? "" : "s"} selected`
              : getStateLabel(selectedCodes[0]!)}
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.8} />
      </button>

      {/* Chips only for multi-select filters; single select shows in the button. */}
      {multiple && selectedCodes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedCodes.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="gap-1 rounded-md pr-1"
            >
              <span>{getStateLabel(code)}</span>
              {!disabled ? (
                <button
                  type="button"
                  aria-label={`Remove ${code}`}
                  className="rounded-sm p-0.5 hover:bg-black/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(code);
                  }}
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={12}
                    strokeWidth={2}
                  />
                </button>
              ) : null}
            </Badge>
          ))}
        </div>
      ) : null}

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className="absolute z-[80] mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-md"
        >
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="Type to search…"
            className="mb-2"
            autoFocus
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={open}
            aria-activedescendant={
              options[highlight]
                ? `${listId}-opt-${options[highlight]!.code}`
                : undefined
            }
          />
          <div className="max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No states found.
              </p>
            ) : (
              options.map((state, index) => {
                const isSelected = selectedCodes.includes(state.code);
                const isActive = index === highlight;
                return (
                  <button
                    key={state.code}
                    id={`${listId}-opt-${state.code}`}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                      isSelected && "bg-muted font-medium",
                      isActive && "bg-muted ring-1 ring-ring",
                    )}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => toggle(state.code)}
                  >
                    <span>
                      {state.name} ({state.code})
                    </span>
                    {isSelected ? (
                      <span className="text-xs text-primary">Selected</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          {multiple ? (
            <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
              Click states to add or remove. Selections stay visible above.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
