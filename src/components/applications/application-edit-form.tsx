"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  updateApplication,
  type ApplicationActionState,
} from "@/actions/applications";
import { ApplicationFields } from "@/components/applications/application-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { Application, School } from "@/db/schema";
import { statusToFormValue } from "@/lib/applications/status";
import { getStateLabel } from "@/lib/geo/us-states";
import {
  updateApplicationSchema,
  type ApplicationFieldsValues,
} from "@/lib/validation/application";

export function ApplicationEditForm({
  application,
  school,
}: {
  application: Application;
  school: School;
}) {
  const [pending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ApplicationActionState | null>(
    null,
  );

  const form = useForm<ApplicationFieldsValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateApplicationSchema) as any,
    defaultValues: {
      schoolId: application.schoolId,
      bcpGpa: application.bcpGpa ?? "",
      overallGpa: application.overallGpa ?? "",
      scienceGpa: application.scienceGpa ?? "",
      pceHours: application.pceHours ?? "",
      applicationAttempt: application.applicationAttempt,
      status: statusToFormValue(application.status),
    },
  });

  function onSubmit(values: ApplicationFieldsValues) {
    setServerState(null);
    startTransition(async () => {
      const result = await updateApplication(application.id, values);
      setServerState(result);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <ApplicationFields
          control={form.control}
          layout="cards"
          schoolDefaultLabel={`${school.name} · ${getStateLabel(school.state)}${
            school.isActive ? "" : " (inactive)"
          }`}
          includeInactiveSchools
        />

        {serverState?.message ? (
          <Alert
            variant={serverState.ok ? "default" : "destructive"}
            className={
              serverState.ok
                ? "border-primary/20 bg-primary/5"
                : "border-destructive/40 bg-destructive/5"
            }
          >
            <AlertTitle>
              {serverState.ok ? "Saved" : "Unable to save"}
            </AlertTitle>
            <AlertDescription>{serverState.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
