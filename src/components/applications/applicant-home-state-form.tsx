"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  updateApplicantHomeState,
  type ApplicationActionState,
} from "@/actions/applications";
import { StateCombobox } from "@/components/schools/state-combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Applicant } from "@/db/schema";
import {
  applicantFormSchema,
  type ApplicantFormValues,
} from "@/lib/validation/applicant";

export function ApplicantHomeStateForm({ applicant }: { applicant: Applicant }) {
  const [pending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<ApplicationActionState | null>(
    null,
  );

  const form = useForm<ApplicantFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(applicantFormSchema) as any,
    defaultValues: {
      homeState: applicant.homeState as ApplicantFormValues["homeState"],
      lastName: applicant.lastName ?? "",
      firstName: applicant.firstName ?? "",
    },
  });

  function onSubmit(values: ApplicantFormValues) {
    setServerState(null);
    startTransition(async () => {
      const result = await updateApplicantHomeState(applicant.id, values);
      setServerState(result);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-md space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="family-name"
                    placeholder="Optional"
                    value={
                      field.value === null || field.value === undefined
                        ? ""
                        : String(field.value)
                    }
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="given-name"
                    placeholder="Optional"
                    value={
                      field.value === null || field.value === undefined
                        ? ""
                        : String(field.value)
                    }
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="homeState"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home state</FormLabel>
              <StateCombobox
                name="homeState"
                value={field.value as string}
                onChange={field.onChange}
              />
              <FormDescription>
                Names are for admin lookup only — not used in statistics or the
                predictor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
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

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save applicant"}
        </Button>
      </form>
    </Form>
  );
}
