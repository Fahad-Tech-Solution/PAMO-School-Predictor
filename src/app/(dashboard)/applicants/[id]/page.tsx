import { Suspense } from "react";

import { ApplicantDetailContent } from "@/components/applicants/applicant-detail-content";
import { ApplicantDetailSkeleton } from "@/components/applicants/applicant-detail-skeleton";
import { requireAuth } from "@/lib/auth/session";

export const instant = false;

export default async function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  return (
    <Suspense fallback={<ApplicantDetailSkeleton />}>
      <ApplicantDetailContent id={id} isAdmin={user.role === "ADMIN"} />
    </Suspense>
  );
}
