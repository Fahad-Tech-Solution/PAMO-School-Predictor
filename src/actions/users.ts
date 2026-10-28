"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { createDb } from "@/db";
import { users } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { countActiveAdmins, getUserById } from "@/lib/users/queries";
import {
  provisionUserSchema,
  updateUserSchema,
} from "@/lib/validation/user";
import { getAppOrigin } from "@/lib/auth/app-url";

export type UserActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const fail = (
  message: string,
  fieldErrors?: Record<string, string[]>,
): UserActionState => ({
  ok: false,
  message,
  fieldErrors,
});

export async function provisionUser(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const admin = await requireAdmin();

  const parsed = provisionUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? "",
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name?.trim() || null;
  const role = parsed.data.role;

  const db = createDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return fail("A user with this email is already provisioned.", {
      email: ["A user with this email is already provisioned."],
    });
  }

  const supabaseAdmin = createServiceRoleClient();
  if (!supabaseAdmin) {
    return fail(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. Cannot provision users in-app.",
    );
  }

  const origin = await getAppOrigin();
  let authUserId: string | null = null;

  const invited = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  });

  if (invited.data.user?.id) {
    authUserId = invited.data.user.id;
  } else {
    // Fallback: create confirmed user if invite fails (e.g. already in Auth).
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (created.error || !created.data.user) {
      const list = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const found = list.data.users.find(
        (u) => u.email?.toLowerCase() === email,
      );
      if (!found) {
        console.error("[users] provision Auth failed", {
          invite: invited.error?.message,
          create: created.error?.message,
        });
        return fail("Unable to create Auth user. Check the email and try again.");
      }
      authUserId = found.id;
    } else {
      authUserId = created.data.user.id;
    }
  }

  const [row] = await db
    .insert(users)
    .values({
      id: authUserId,
      email,
      name,
      role,
      isActive: true,
    })
    .returning();

  after(async () => {
    await writeAuditLog({
      userId: admin.id,
      action: "CREATE USER",
      entityType: "user",
      entityId: row.id,
      newValues: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        isActive: row.isActive,
      },
    });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  });

  return {
    ok: true,
    message: `Provisioned ${email} as ${role}. They can sign in once Auth invite/setup completes.`,
  };
}

export async function updateUser(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const admin = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name") ?? "",
    role: formData.get("role"),
    isActive:
      formData.get("isActive") === "on" ||
      formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return fail(
      "Please correct the highlighted fields.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const existing = await getUserById(parsed.data.userId);
  if (!existing) {
    return fail("User not found.");
  }

  if (existing.id === admin.id && !parsed.data.isActive) {
    return fail("You cannot deactivate your own account.");
  }

  if (
    existing.id === admin.id &&
    existing.role === "ADMIN" &&
    parsed.data.role !== "ADMIN"
  ) {
    return fail("You cannot demote your own admin role.");
  }

  const demotingOrDeactivatingAdmin =
    existing.role === "ADMIN" &&
    existing.isActive &&
    (parsed.data.role !== "ADMIN" || !parsed.data.isActive);

  if (demotingOrDeactivatingAdmin) {
    const otherAdmins = await countActiveAdmins(existing.id);
    if (otherAdmins < 1) {
      return fail("Cannot remove the last active ADMIN.");
    }
  }

  const db = createDb();
  const [updated] = await db
    .update(users)
    .set({
      name: parsed.data.name?.trim() || null,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id))
    .returning();

  const action =
    existing.isActive && !updated.isActive
      ? "DEACTIVATE USER"
      : !existing.isActive && updated.isActive
        ? "REACTIVATE USER"
        : "UPDATE USER";

  after(async () => {
    await writeAuditLog({
      userId: admin.id,
      action,
      entityType: "user",
      entityId: existing.id,
      oldValues: {
        email: existing.email,
        name: existing.name,
        role: existing.role,
        isActive: existing.isActive,
      },
      newValues: {
        email: updated.email,
        name: updated.name,
        role: updated.role,
        isActive: updated.isActive,
      },
    });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  });

  return { ok: true, message: "User updated." };
}
