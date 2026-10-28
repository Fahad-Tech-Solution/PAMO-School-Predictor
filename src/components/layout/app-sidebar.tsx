"use client";

import {
  DashboardSquare01Icon,
  File02Icon,
  School01Icon,
  Settings01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarMobileAccount,
  SidebarUserMenu,
} from "@/components/layout/sidebar-user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { navItems, siteConfig } from "@/config/site";
import type { AppUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const navIcons = {
  dashboard: DashboardSquare01Icon,
  schools: School01Icon,
  applications: File02Icon,
  predictor: SparklesIcon,
  settings: Settings01Icon,
} as const;

export function AppSidebar({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border bg-white p-2">
        <div className={cn("flex items-center", isMobile ? "gap-2" : "gap-1")}>
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
          >
            {isMobile ? (
              <Image
                src="/pamo-logo.jpg"
                alt={siteConfig.name}
                width={520}
                height={220}
                className="h-8 w-auto max-w-[9.5rem] object-contain object-left"
                priority
              />
            ) : (
              <>
                <Image
                  src="/pamo-logo.jpg"
                  alt={siteConfig.name}
                  width={520}
                  height={220}
                  className="h-auto w-full object-contain group-data-[collapsible=icon]:hidden"
                  priority
                />
                <Image
                  src="/favicon-96x96.png"
                  alt={siteConfig.name}
                  width={32}
                  height={32}
                  className="hidden size-8 rounded-md object-contain group-data-[collapsible=icon]:block"
                  priority
                />
              </>
            )}
          </Link>
          <SidebarTrigger className="shrink-0 text-primary hover:bg-muted hover:text-primary" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const icon = navIcons[item.icon];

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      title={item.title}
                      prefetch
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                      className={cn(
                        "flex h-10 items-center gap-2 overflow-hidden rounded-md p-2 text-sm outline-none transition-colors md:h-8",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground",
                      )}
                    >
                      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
                      <span className="truncate group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarMobileAccount user={user} />
      </SidebarContent>

      <SidebarFooter className="hidden border-t border-sidebar-border bg-white md:flex">
        <SidebarUserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
