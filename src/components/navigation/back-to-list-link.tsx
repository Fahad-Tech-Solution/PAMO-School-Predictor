"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  readListReturnHref,
  shouldUseHistoryBackToList,
} from "@/components/navigation/list-return";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  storageKey: string;
  className?: string;
  children: ReactNode;
};

/**
 * Prefer history.back() when the previous entry is this list (or we marked a
 * list→child navigation). Otherwise navigate to the remembered list URL.
 */
export function BackToListLink({
  basePath,
  storageKey,
  className,
  children,
}: Props) {
  const router = useRouter();
  const [href, setHref] = useState(basePath);

  useEffect(() => {
    setHref(readListReturnHref(basePath, storageKey));
  }, [basePath, storageKey]);

  return (
    <Link
      href={href}
      className={cn(
        "text-sm text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={(event) => {
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

        if (shouldUseHistoryBackToList(basePath, storageKey)) {
          event.preventDefault();
          router.back();
        }
        // Otherwise Link uses remembered href (filters preserved when available).
      }}
    >
      {children}
    </Link>
  );
}
