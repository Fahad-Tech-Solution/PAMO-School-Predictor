"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  markNavigatedFromList,
  writeListReturnHref,
} from "@/components/navigation/list-return";

type Props = {
  basePath: string;
  storageKey: string;
};

/** Persist the current list URL and mark list→child clicks for smart Back. */
export function RememberListReturn({ basePath, storageKey }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== basePath) return;
    const qs = searchParams.toString();
    writeListReturnHref(
      basePath,
      storageKey,
      qs ? `${pathname}?${qs}` : pathname,
    );
  }, [basePath, storageKey, pathname, searchParams]);

  useEffect(() => {
    if (pathname !== basePath) return;

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor) return;

      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(raw, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      // Child routes: /applications/new, /applications/[id], /schools/[id], etc.
      if (
        url.pathname.startsWith(`${basePath}/`) &&
        url.pathname !== basePath
      ) {
        markNavigatedFromList(storageKey);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [basePath, storageKey, pathname]);

  return null;
}
