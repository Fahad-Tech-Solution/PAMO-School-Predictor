"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setWidth(100);
    const hide = window.setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 180);
    timers.current.push(hide);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    setActive(true);
    setWidth(12);
    const tick = (next: number, delay: number) => {
      const id = window.setTimeout(() => setWidth(next), delay);
      timers.current.push(id);
    };
    tick(35, 120);
    tick(55, 320);
    tick(72, 700);
    tick(85, 1400);
  }, [clearTimers]);

  useEffect(() => {
    // Defer so route commits first; avoids sync setState-in-effect lint.
    const id = window.setTimeout(() => finish(), 0);
    return () => window.clearTimeout(id);
  }, [pathname, searchParams, finish]);

  useEffect(() => {
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

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      start();
    };

    const onNavStart = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("pamo:navigation-start", onNavStart);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pamo:navigation-start", onNavStart);
    };
  }, [start]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return (
    <div
      aria-hidden={!active}
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]"
    >
      <div
        className="h-full origin-left bg-secondary shadow-[0_0_8px_rgba(251,184,35,0.65)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${width}%`,
          opacity: active ? 1 : 0,
        }}
      />
    </div>
  );
}

/** Thin top progress bar for App Router navigations. */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}

/** Call before programmatic navigations (router.push / replace). */
export function signalNavigationStart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pamo:navigation-start"));
  }
}
