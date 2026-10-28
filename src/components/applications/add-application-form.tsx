"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createApplicationForApplicant,
  type ApplicationActionState,
} from "@/actions/applications";
import { ApplicationFields } from "@/components/applications/application-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  createApplicationForApplicantSchema,
  type MultiSchoolApplicationFieldsValues,
} from "@/lib/validation/application";

export function AddApplicationForm({ applicantId }: { applicantId: string }) {
  const [pending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ApplicationActionState | null>(
    null,
  );

  const form = useForm<MultiSchoolApplicationFieldsValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createApplicationForApplicantSchema) as any,
    defaultValues: {
      schoolIds: [],
      schoolOutcomes: [],
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
    },
  });

  function onSubmit(values: MultiSchoolApplicationFieldsValues) {
    setServerState(null);
    startTransition(async () => {
      const result = await createApplicationForApplicant(applicantId, values);
      if (result) setServerState(result);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <ApplicationFields control={form.control} layout="cards" multiSchool />

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
            {pending ? "Saving…" : "Add application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
