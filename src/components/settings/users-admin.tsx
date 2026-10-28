import { ProvisionUserForm } from "@/components/settings/provision-user-form";
import { UserRowForm } from "@/components/settings/user-row-form";
import type { User } from "@/db/schema";

export function UsersAdmin({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">User management</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Provision app access for existing or invited Auth users. Profiles must
          match <code className="text-[11px]">auth.users.id</code>.
        </p>
      </div>

      <ProvisionUserForm />

      <div className="rounded-lg border border-border bg-white p-4">
        <h4 className="text-sm font-semibold text-foreground">
          Provisioned users ({users.length})
        </h4>
        {users.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <div className="mt-2">
            {users.map((user) => (
              <UserRowForm
                key={user.id}
                user={user}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
