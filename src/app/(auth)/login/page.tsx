import Image from "next/image";

import { LoginForm } from "@/components/auth/login-form";
import { siteConfig } from "@/config/site";

export const instant = false;

const ERROR_MESSAGES: Record<string, string> = {
  not_provisioned:
    "Your account is not provisioned for this application. Contact an administrator.",
  auth_callback: "Authentication link is invalid or expired. Try again.",
  missing_code: "Authentication link is incomplete. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const notice = params.error ? ERROR_MESSAGES[params.error] ?? null : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-10">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <Image
          src="/pamo-logo.jpg"
          alt={siteConfig.name}
          width={520}
          height={220}
          className="mx-auto h-auto w-56 object-contain"
          priority
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Private application. No public registration.
        </p>
        <div className="mt-6">
          <LoginForm notice={notice} />
        </div>
      </div>
    </div>
  );
}
