"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  createApplicationWithApplicant,
  type ApplicationActionState,
} from "@/actions/applications";
import { ApplicationFields } from "@/components/applications/application-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  createApplicationWithApplicantSchema,
  type CreateApplicationWithApplicantValues,
} from "@/lib/validation/application";

const emptyDefaults: CreateApplicationWithApplicantValues = {
  homeState: "",
  schoolIds: [],
  schoolOutcomes: [],
  bcpGpa: "",
  overallGpa: "",
  scienceGpa: "",
  pceHours: "",
  greScore: "",
};

export function ApplicationCreateForm({
  justSaved = false,
}: {
  justSaved?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ApplicationActionState | null>(
    justSaved
      ? {
          ok: true,
          message: "Application saved. This form is ready for the next one.",
        }
      : null,
  );

  const form = useForm<CreateApplicationWithApplicantValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createApplicationWithApplicantSchema) as any,
    defaultValues: emptyDefaults,
  });

  function onSubmit(values: CreateApplicationWithApplicantValues) {
    setServerState(null);
    startTransition(async () => {
      const result = await createApplicationWithApplicant(values);
      if (result) setServerState(result);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <ApplicationFields
          control={form.control}
          layout="cards"
          includeHomeState
          multiSchool
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
          <Button type="submit" size="default" disabled={pending}>
            {pending ? "Saving…" : "Save application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
