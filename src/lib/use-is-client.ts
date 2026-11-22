"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True after hydration on the client; false during SSR / the first server snapshot.
 * Prefer this over `useState` + `useEffect(() => setMounted(true))`.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
