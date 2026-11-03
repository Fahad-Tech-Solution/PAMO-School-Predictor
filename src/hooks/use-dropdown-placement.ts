"use client";

import {
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";

export type DropdownSide = "top" | "bottom";

export type DropdownPlacement = {
  side: DropdownSide;
  maxHeight: number;
};

const DEFAULT_MAX = 240;
const MIN_MAX = 120;
const GAP_PX = 4;

/**
 * Prefer opening the list toward the side of the viewport with more room,
 * and cap max-height so the panel stays on-screen.
 */
export function useDropdownPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  preferredMaxHeight = DEFAULT_MAX,
): DropdownPlacement {
  const [placement, setPlacement] = useState<DropdownPlacement>({
    side: "bottom",
    maxHeight: preferredMaxHeight,
  });

  useLayoutEffect(() => {
    if (!open) return;

    function update() {
      const el = anchorRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - GAP_PX;
      const spaceAbove = rect.top - GAP_PX;
      const side: DropdownSide =
        spaceBelow >= spaceAbove ? "bottom" : "top";
      const available = side === "bottom" ? spaceBelow : spaceAbove;
      const maxHeight = Math.max(
        MIN_MAX,
        Math.min(preferredMaxHeight, Math.floor(available)),
      );

      setPlacement((prev) =>
        prev.side === side && prev.maxHeight === maxHeight
          ? prev
          : { side, maxHeight },
      );
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, preferredMaxHeight]);

  return placement;
}
