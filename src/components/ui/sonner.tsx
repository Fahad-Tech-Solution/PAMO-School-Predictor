"use client";

import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  MultiplicationSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-right"
      closeButton
      icons={{
        success: (
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            className="size-4 text-white"
          />
        ),
        info: (
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={2}
            className="size-4 text-white"
          />
        ),
        warning: (
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4 text-white"
          />
        ),
        error: (
          <HugeiconsIcon
            icon={MultiplicationSignCircleIcon}
            strokeWidth={2}
            className="size-4 text-white"
          />
        ),
        loading: (
          <HugeiconsIcon
            icon={Loading03Icon}
            strokeWidth={2}
            className="size-4 animate-spin text-white"
          />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-primary !text-primary-foreground !border-primary shadow-lg",
          title: "!text-primary-foreground font-semibold",
          description: "!text-primary-foreground/90",
          closeButton:
            "!bg-primary !text-primary-foreground !border-primary-foreground/30",
          success:
            "!bg-primary !text-primary-foreground !border-primary",
          error:
            "!bg-primary !text-primary-foreground !border-primary",
          info: "!bg-primary !text-primary-foreground !border-primary",
          warning:
            "!bg-primary !text-primary-foreground !border-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
