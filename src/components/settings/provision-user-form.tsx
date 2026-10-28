"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { provisionUser, type UserActionState } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UserActionState = { ok: false, message: "" };

export function ProvisionUserForm() {
  const [state, formAction, pending] = useActionState(provisionUser, initialState);
  const toasted = useRef<string | null>(null);

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
      className="space-y-3 rounded-lg border border-border bg-white p-4"
    >
      <div>
        <h4 className="text-sm font-semibold text-foreground">Provision user</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Creates / invites a Supabase Auth user and a matching app profile. No
          public registration.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            defaultValue="VIEWER"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="VIEWER">VIEWER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      {state.message && !state.ok ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
          <AlertTitle>Unable to provision</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Provisioning…" : "Provision user"}
      </Button>
    </form>
  );
}
