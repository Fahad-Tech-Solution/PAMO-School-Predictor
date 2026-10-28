"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { AppUser } from "@/lib/auth/types";

type AppShellProps = {
  children: React.ReactNode;
  user: AppUser;
  title?: string;
};

export function AppShell({ children, user, title }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-white px-3 md:hidden">
          <SidebarTrigger className="size-10 text-primary" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="text-sm font-medium text-primary">PAMO</span>
        </header>
        {title ? (
          <header className="hidden border-b border-border bg-white px-6 py-4 md:block">
            <h1 className="text-xl font-semibold text-primary">{title}</h1>
          </header>
        ) : null}
        <div className="flex-1 px-6 py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
