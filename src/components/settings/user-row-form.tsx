"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { updateUser, type UserActionState } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/db/schema";

const initialState: UserActionState = { ok: false, message: "" };

export function UserRowForm({
  user,
  currentUserId,
}: {
  user: User;
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(updateUser, initialState);
  const toasted = useRef<string | null>(null);
  const isSelf = user.id === currentUserId;

  useEffect(() => {
    if (!state.message) return;
    const key = `${state.ok}:${state.message}`;
    if (toasted.current === key) return;
    toasted.current = key;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid gap-2 border-b border-border py-3 last:border-0 md:grid-cols-[1.4fr_1fr_auto_auto_auto] md:items-end"
    >
      <input type="hidden" name="userId" value={user.id} />
      {isSelf ? (
        <>
          <input type="hidden" name="role" value={user.role} />
          <input type="hidden" name="isActive" value="true" />
        </>
      ) : null}

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.email}</p>
        <Input
          name="name"
          defaultValue={user.name ?? ""}
          placeholder="Display name"
          className="mt-1"
        />
      </div>
      <div>
        {isSelf ? (
          <p className="flex h-8 items-center text-sm">{user.role}</p>
        ) : (
          <select
            name="role"
            defaultValue={user.role}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="VIEWER">VIEWER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        )}
      </div>
      {isSelf ? (
        <p className="flex h-8 items-center text-sm text-muted-foreground">
          Active
        </p>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={user.isActive}
          />
          Active
        </label>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {isSelf ? (
        <p className="text-xs text-muted-foreground md:col-span-5">
          You cannot deactivate or demote your own account.
        </p>
      ) : null}
    </form>
  );
}
