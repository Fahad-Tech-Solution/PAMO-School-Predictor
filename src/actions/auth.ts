"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { getAppOrigin } from "@/lib/auth/app-url";
import {
  AUTH_RATE_LIMITS,
  checkRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  magicLinkSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const initialFailure = (message: string): AuthActionState => ({
  ok: false,
  message,
});

async function assertProvisionedUser(authUserId: string): Promise<AuthActionState | null> {
  const db = createDb();
  const [row] = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, authUserId))
    .limit(1);

  if (!row) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return initialFailure(
      "Your account is not provisioned for this application. Contact an administrator.",
    );
  }

  if (!row.isActive) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return initialFailure("Your account is inactive. Contact an administrator.");
  }

  return null;
}

async function enforceAuthRateLimit(
  action: keyof typeof AUTH_RATE_LIMITS,
): Promise<AuthActionState | null> {
  const ip = await getClientIp();
  const { limit, windowMs } = AUTH_RATE_LIMITS[action];
  const result = await checkRateLimit(`auth:${action}:${ip}`, limit, windowMs);

  if (!result.ok) {
    return initialFailure(
      `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.`,
    );
  }

  return null;
}

export async function signInWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rateLimited = await enforceAuthRateLimit("login");
  if (rateLimited) return rateLimited;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return initialFailure("Invalid email or password.");
  }

  const provisionError = await assertProvisionedUser(data.user.id);
  if (provisionError) {
    return provisionError;
  }

  redirect("/dashboard");
}

export async function signInWithMagicLink(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rateLimited = await enforceAuthRateLimit("magicLink");
  if (rateLimited) return rateLimited;

  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please enter a valid email.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    // Generic response — avoid leaking whether the account exists.
    return {
      ok: true,
      message: "Check your email for the magic link.",
    };
  }

  return {
    ok: true,
    message: "Check your email for the magic link.",
  };
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rateLimited = await enforceAuthRateLimit("passwordReset");
  if (rateLimited) return rateLimited;

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please enter a valid email.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("[auth] password reset request failed");
  }

  // Same message whether or not the email exists (avoid enumeration).
  return {
    ok: true,
    message: "If that email is registered, you will receive a reset link shortly.",
  };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const rateLimited = await enforceAuthRateLimit("updatePassword");
  if (rateLimited) return rateLimited;

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return initialFailure("Your reset session expired. Request a new link.");
  }

  const provisionError = await assertProvisionedUser(user.id);
  if (provisionError) {
    return provisionError;
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return initialFailure("Unable to update password. Try a different password.");
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  // Local scope: clear this browser session only (faster than global revoke).
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
