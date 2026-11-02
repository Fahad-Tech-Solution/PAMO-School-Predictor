import { redirect } from "next/navigation";

import { ApplicationCreateForm } from "@/components/applications/application-create-form";
import { BackToApplicationsLink } from "@/components/applications/back-to-applications-link";
import { requireAuth } from "@/lib/auth/session";

export const instant = false;

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/applications");
  }

  const params = await searchParams;
  const savedToken = params.saved?.trim() || null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <BackToApplicationsLink />
        <h2 className="mt-2 text-lg font-semibold text-primary">
          Add application
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates an anonymous applicant (home state) and the first application
          record.
        </p>
      </div>

      <ApplicationCreateForm
        key={savedToken ?? "new"}
        justSaved={savedToken != null}
      />
    </div>
  );
}
