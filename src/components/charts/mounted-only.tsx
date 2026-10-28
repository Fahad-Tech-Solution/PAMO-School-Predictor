"use client";

import { useEffect, useState, type ReactNode } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return fallback;
  return children;
}
