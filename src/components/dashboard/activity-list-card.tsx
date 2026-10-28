import {
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  School01Icon,
  TimeQuarterPassIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ActivityListCard({
  title,
  subtitle,
  viewAllHref,
  children,
  emptyMessage,
  isEmpty,
}: {
  title: string;
  subtitle: string;
  viewAllHref: string;
  children: ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0",
          )}
        >
          View All
        </Link>
      </div>

      {isEmpty ? (
        <p className="mt-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">{children}</ul>
      )}
    </section>
  );
}

export function ActivityRow({
  href,
  icon,
  iconClassName,
  title,
  subtitle,
  when,
  primaryRight,
  primaryRightClassName,
  secondaryRight,
}: {
  href: string;
  icon: IconSvgElement;
  iconClassName?: string;
  title: string;
  subtitle: string;
  when: string;
  primaryRight: string;
  primaryRightClassName?: string;
  secondaryRight: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 py-3.5 transition-colors hover:bg-muted/20"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground",
            iconClassName,
          )}
        >
          <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {title}
          </p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <p className="hidden shrink-0 text-sm text-muted-foreground sm:block sm:w-28 sm:text-left md:w-32">
          {when}
        </p>

        <div className="w-24 shrink-0 text-right sm:w-28">
          <p
            className={cn(
              "text-sm font-semibold text-foreground",
              primaryRightClassName,
            )}
          >
            {primaryRight}
          </p>
          <p className="text-xs text-muted-foreground">{secondaryRight}</p>
        </div>
      </Link>
    </li>
  );
}

export function decisionIcon(status: string | null) {
  switch (status) {
    case "ACCEPTED":
      return {
        icon: CheckmarkCircle02Icon,
        className: "bg-primary text-primary-foreground",
      };
    case "NOT_ACCEPTED":
      return {
        icon: CancelCircleIcon,
        className: "bg-muted text-muted-foreground",
      };
    case "WAITLISTED":
      return {
        icon: TimeQuarterPassIcon,
        className: "bg-primary text-primary-foreground",
      };
    default:
      return {
        icon: HelpCircleIcon,
        className: "bg-muted text-muted-foreground",
      };
  }
}

export function schoolStatusIcon(isActive: boolean) {
  return {
    icon: School01Icon,
    className: isActive
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground",
  };
}

export function formatActivityWhen(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86_400_000,
  );

  // Fixed locale so SSR and client never diverge on formatting.
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
