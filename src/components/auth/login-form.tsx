"use client";

import { useActionState, useState } from "react";

import {
  requestPasswordReset,
  signInWithPassword,
  type AuthActionState,
} from "@/actions/auth";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialState: AuthActionState = { ok: false, message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs font-medium text-red-700">{errors[0]}</p>;
}

function AuthMessage({ state }: { state: AuthActionState }) {
  if (!state.message) return null;

  return (
    <div
      role="alert"
      className={
        state.ok
          ? "rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          : "rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
      }
    >
      <p className="font-semibold">{state.ok ? "Success" : "Unable to continue"}</p>
      <p className="mt-0.5">{state.message}</p>
    </div>
  );
}

export function LoginForm({ notice }: { notice?: string | null }) {
  const [tab, setTab] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [forgotState, forgotAction, forgotPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  const activeMessage = tab === "password" ? passwordState : forgotState;

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <p className="font-semibold">Sign-in blocked</p>
          <p className="mt-0.5">{notice}</p>
        </div>
      ) : null}

      {activeMessage.message ? <AuthMessage state={activeMessage} /> : null}

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="forgot">Forgot</TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="space-y-4 pt-2">
          <form action={passwordAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="password-email">Email</Label>
              <Input
                id="password-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <FieldError errors={passwordState.fieldErrors?.email} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password-password">Password</Label>
              <PasswordInput
                id="password-password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <FieldError errors={passwordState.fieldErrors?.password} />
            </div>
            <Button type="submit" className="w-full" disabled={passwordPending}>
              {passwordPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="forgot" className="space-y-4 pt-2">
          <form action={forgotAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
              />
              <FieldError errors={forgotState.fieldErrors?.email} />
            </div>
            <Button type="submit" className="w-full" disabled={forgotPending}>
              {forgotPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
