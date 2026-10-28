"use client";

import type { ReactNode } from "react";

import { BackToListLink } from "@/components/navigation/back-to-list-link";
import { APPLICATIONS_RETURN_KEY } from "@/components/navigation/list-return";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function BackToApplicationsLink({
  className,
  children = "← Back to applications",
}: Props) {
  return (
    <BackToListLink
      basePath="/applications"
      storageKey={APPLICATIONS_RETURN_KEY}
      className={className}
    >
      {children}
    </BackToListLink>
  );
}
