"use client";

import {
  Logout03Icon,
  UnfoldMoreIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AppUser } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function initialsFor(user: AppUser): string {
  if (user.name?.trim()) {
    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
  return user.email.slice(0, 2).toUpperCase();
}

/** Full-viewport blocker shown the instant logout starts. */
function LogoutOverlay({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  if (!active || !mounted) return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label="Signing out"
      className="fixed inset-0 z-[9999] flex cursor-wait items-center justify-center bg-black/45"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground shadow-lg">
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
          aria-hidden
        />
        Signing out…
      </div>
    </div>,
    document.body,
  );
}

function useLogout() {
  const [loggingOut, setLoggingOut] = useState(false);

  function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    // Clear the session first so /login is not bounced back to /dashboard.
    void createClient()
      .auth.signOut({ scope: "local" })
      .catch(() => {
        // Still leave the app; a hard navigation clears stale UI state.
      })
      .finally(() => {
        window.location.assign("/login");
      });
  }

  return {
    loggingOut,
    handleLogout,
  };
}

/** Mobile: separator + name/email + logout under Settings. */
export function SidebarMobileAccount({ user }: { user: AppUser }) {
  const displayName = user.name?.trim() || "Account";
  const { loggingOut, handleLogout } = useLogout();
  const { setOpenMobile } = useSidebar();

  return (
    <div className="mt-2 space-y-3 px-2 pb-2 md:hidden">
      <LogoutOverlay active={loggingOut} />
      <SidebarSeparator className="mx-0" />
      <div className="px-2">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {displayName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <button
        type="button"
        disabled={loggingOut}
        onClick={() => {
          handleLogout();
          setOpenMobile(false);
        }}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-full justify-center gap-2 touch-manipulation text-destructive hover:bg-destructive/10 hover:text-destructive",
        )}
      >
        <HugeiconsIcon icon={Logout03Icon} size={16} strokeWidth={1.8} />
        {loggingOut ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}

/** Desktop footer account menu. */
export function SidebarUserMenu({ user }: { user: AppUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const displayName = user.name?.trim() || user.email;
  const initials = initialsFor(user);
  const { loggingOut, handleLogout } = useLogout();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <SidebarMenu className="hidden md:flex">
      <LogoutOverlay active={loggingOut} />
      <SidebarMenuItem>
        <div ref={rootRef} className="relative w-full">
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-foreground outline-none transition-colors",
              "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              open && "bg-muted",
            )}
          >
            <Avatar className="size-8 rounded-lg after:rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-xs text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              size={16}
              strokeWidth={1.8}
              className="ml-auto shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
            />
          </button>

          {open ? (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 bottom-[calc(100%+0.5rem)] z-50 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
            >
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                <Avatar className="size-8 rounded-lg after:rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary text-xs text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-8 w-full justify-start gap-2 px-2 font-normal",
                )}
                onClick={() => {
                  setOpen(false);
                  router.push("/settings");
                }}
              >
                <HugeiconsIcon
                  icon={UserCircleIcon}
                  size={16}
                  strokeWidth={1.8}
                />
                Account
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                disabled={loggingOut}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-8 w-full justify-start gap-2 px-2 font-normal text-destructive hover:bg-destructive/10 hover:text-destructive",
                )}
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
              >
                <HugeiconsIcon
                  icon={Logout03Icon}
                  size={16}
                  strokeWidth={1.8}
                />
                {loggingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          ) : null}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
