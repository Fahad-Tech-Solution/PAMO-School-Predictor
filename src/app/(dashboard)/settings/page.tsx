import { Suspense } from "react";

import { AuditHistory } from "@/components/settings/audit-history";
import { UsersAdmin } from "@/components/settings/users-admin";
import { listAuditLogs } from "@/lib/audit/queries";
import { requireAuth } from "@/lib/auth/session";
import { listUsers } from "@/lib/users/queries";

export const instant = false;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    entityType?: string;
    page?: string;
  }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const [users, audit] = await Promise.all([
    isAdmin ? listUsers() : Promise.resolve([]),
    isAdmin
      ? listAuditLogs({
          q: params.q,
          entityType: params.entityType,
          page: Math.max(1, Number(params.page ?? "1") || 1),
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-primary">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Account details
          {isAdmin ? ", user provisioning, and audit history" : ""}.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-white p-4">
        <h3 className="text-sm font-semibold text-foreground">Your account</h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd className="font-medium">{user.name?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="font-medium">
              {user.isActive ? "Active" : "Inactive"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Use the sidebar user menu to sign out.
        </p>
      </section>

      {isAdmin ? (
        <>
          <UsersAdmin users={users} currentUserId={user.id} />
          <Suspense
            fallback={
              <div className="h-40 rounded-lg border border-border bg-muted/30" />
            }
          >
            {audit ? <AuditHistory result={audit} /> : null}
          </Suspense>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          User management and full audit history are available to administrators
          only.
        </p>
      )}
    </div>
  );
}
