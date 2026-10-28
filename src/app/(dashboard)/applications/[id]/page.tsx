import { Suspense } from "react";

import { ApplicationDetailContent } from "@/components/applications/application-detail-content";
import { ApplicationDetailSkeleton } from "@/components/applications/application-detail-skeleton";
import { requireAuth } from "@/lib/auth/session";

export const instant = false;

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  return (
    <Suspense fallback={<ApplicationDetailSkeleton />}>
      <ApplicationDetailContent id={id} isAdmin={user.role === "ADMIN"} />
    </Suspense>
  );
}
