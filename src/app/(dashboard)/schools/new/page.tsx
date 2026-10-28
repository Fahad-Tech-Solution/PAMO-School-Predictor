import { redirect } from "next/navigation";

import { BackToSchoolsLink } from "@/components/schools/back-to-schools-link";
import { SchoolForm } from "@/components/schools/school-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/session";

export const instant = false;

export default async function NewSchoolPage() {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/schools");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <BackToSchoolsLink />

      <Card className="w-full overflow-visible bg-white">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold text-primary">
            Add school
          </CardTitle>
          <CardDescription>
            Create a PA program with name, state, and GRE requirement.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          <SchoolForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
