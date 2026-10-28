import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";

export const instant = false;

/** Shortcut into the create workflow (applicant + first application). */
export default async function NewApplicantPage() {
  const user = await requireAuth();
  redirect(user.role === "ADMIN" ? "/applications/new" : "/applications");
}
