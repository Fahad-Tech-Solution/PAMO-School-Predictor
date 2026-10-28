"use client";

import type { ReactNode } from "react";

import { BackToListLink } from "@/components/navigation/back-to-list-link";
import { SCHOOLS_RETURN_KEY } from "@/components/navigation/list-return";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function BackToSchoolsLink({
  className,
  children = "← Back to schools",
}: Props) {
  return (
    <BackToListLink
      basePath="/schools"
      storageKey={SCHOOLS_RETURN_KEY}
      className={className}
    >
      {children}
    </BackToListLink>
  );
}
