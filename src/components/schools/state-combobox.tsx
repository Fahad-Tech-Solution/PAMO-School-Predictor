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
  type KeyboardEvent,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDropdownPlacement } from "@/hooks/use-dropdown-placement";
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
  const {
    name,
    disabled,
    placeholder = "Search state…",
    id,
  } = props;
  const multiple = props.multiple === true;

  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const { side, maxHeight } = useDropdownPlacement(open, anchorRef, 224);

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
        closeList();
      }
    };
    const onDocKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeList();
      }
    };

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

  function closeList() {
    setOpen(false);
    setQuery("");
    setHighlight(0);
  }

  function toggle(code: string) {
    if (multiple) {
      const exists = selectedMulti.includes(code);
      setMulti(
        exists
          ? selectedMulti.filter((item) => item !== code)
          : [...selectedMulti, code],
      );
      closeList();
      return;
    }

    setInternalSingle(code);
    props.onChange?.(code);
    closeList();
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
    if (event.key === "Tab") {
      if (open) closeList();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (options.length === 0) return;
      setHighlight((index) => Math.min(index + 1, options.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      if (!open || options.length === 0) return;
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      if (!open || options.length === 0) return;
      event.preventDefault();
      const option = options[highlight] ?? options[0];
      if (option) toggle(option.code);
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("space-y-1.5", open && "relative z-[80]")}
    >
      {multiple ? (
        <input type="hidden" name={name} value={selectedMulti.join(",")} />
      ) : (
        <input type="hidden" name={name} value={selectedSingle} />
      )}

      <div ref={anchorRef} className="relative min-w-0">
        <HugeiconsIcon
          icon={SearchIcon}
          size={16}
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          value={query}
          disabled={disabled}
          placeholder={
            multiple
              ? placeholder
              : selectedSingle
                ? getStateLabel(selectedSingle)
                : placeholder
          }
          className="pl-9"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onKeyDown={onSearchKeyDown}
          aria-controls={listId}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[highlight]
              ? `${listId}-opt-${options[highlight]!.code}`
              : undefined
          }
          role="combobox"
        />

        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            style={{ maxHeight }}
            className={cn(
              "absolute z-[80] w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md",
              side === "bottom" ? "top-full mt-1" : "bottom-full mb-1",
            )}
          >
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
                    tabIndex={-1}
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
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        Selected
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          size={14}
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

      {!multiple && selectedSingle ? (
        <div className="flex items-center gap-2 rounded-md border border-secondary bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          <HugeiconsIcon
            icon={Tick02Icon}
            size={16}
            strokeWidth={2.2}
            className="shrink-0"
          />
          <span className="min-w-0 flex-1 truncate font-medium">
            {getStateLabel(selectedSingle)} ({selectedSingle})
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            className="hover:bg-secondary-foreground/10"
            onClick={() => remove(selectedSingle)}
            aria-label="Clear home state"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
