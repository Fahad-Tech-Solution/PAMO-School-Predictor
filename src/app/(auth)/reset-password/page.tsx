import Image from "next/image";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { siteConfig } from "@/config/site";

export const instant = false;

export default function ResetPasswordPage() {
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
        <h1 className="mt-4 text-center text-lg font-semibold text-primary">
          Reset password
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
