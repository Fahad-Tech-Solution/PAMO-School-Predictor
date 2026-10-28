import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

export const instant = false;

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
