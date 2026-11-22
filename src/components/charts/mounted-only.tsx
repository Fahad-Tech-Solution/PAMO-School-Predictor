"use client";

import type { ReactNode } from "react";

import { useIsClient } from "@/lib/use-is-client";

/**
 * Skip SSR for children that measure the DOM (e.g. Recharts ResponsiveContainer).
 * Avoids hydration attribute mismatches on width/height.
 */
export function MountedOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const mounted = useIsClient();

  if (!mounted) return fallback;
  return children;
}
