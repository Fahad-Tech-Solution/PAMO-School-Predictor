"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  runPredictorAction,
  type PredictorActionState,
} from "@/actions/predictor";
import { PredictorResults } from "@/components/predictor/predictor-results";
import { SchoolSelector } from "@/components/schools/school-selector";
import { StateCombobox } from "@/components/schools/state-combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MAX_SCHOOLS } from "@/lib/predictor/config";
import {
  predictorFormSchema,
  type PredictorFormInput,
} from "@/lib/validation/predictor";

export function PredictorForm() {
  const [pending, startTransition] = useTransition();
  const [serverState, setServerState] = useState<PredictorActionState | null>(
    null,
  );

  const form = useForm<PredictorFormInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(predictorFormSchema) as any,
    defaultValues: {
      homeState: "",
      bcpGpa: "",
      overallGpa: "",
      scienceGpa: "",
      pceHours: "",
      schoolIds: [],
    },
  });

  function onSubmit(values: PredictorFormInput) {
    setServerState(null);
    startTransition(async () => {
      const result = await runPredictorAction(values);
      setServerState(result);
    });
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="overflow-visible bg-white">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-semibold text-primary">
                  Home state
                </CardTitle>
                <CardDescription>
                  Used to derive in-state / out-of-state vs each school.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-visible pt-4">
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
                        placeholder="Select one state…"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="overflow-visible bg-white">
              <CardHeader className="border-b">
                <CardTitle className="text-base font-semibold text-primary">
                  GPAs & PCE
                </CardTitle>
                <CardDescription>
                  Optional academic inputs. GRE is not used as an applicant
                  feature.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <GpaField
                    control={form.control}
                    name="bcpGpa"
                    label="BCP GPA"
                  />
                  <GpaField
                    control={form.control}
                    name="overallGpa"
                    label="Overall GPA"
                  />
                  <GpaField
                    control={form.control}
                    name="scienceGpa"
                    label="Science GPA"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pceHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PCE hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="Optional"
                          value={
                            field.value === null || field.value === undefined
                              ? ""
                              : String(field.value)
                          }
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="w-full overflow-visible bg-white">
            <CardHeader className="border-b">
              <CardTitle className="text-base font-semibold text-primary">
                Schools to compare
              </CardTitle>
              <CardDescription>
                Select 1–{MAX_SCHOOLS} schools. Active schools only for new
                comparisons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 overflow-visible pt-4">
              <FormField
                control={form.control}
                name="schoolIds"
                render={({ field }) => (
                  <FormItem>
                    <SchoolSelector
                      multiple
                      name="schoolIds"
                      label=""
                      value={(field.value as string[]) ?? []}
                      onChange={(ids) =>
                        field.onChange(ids.slice(0, MAX_SCHOOLS))
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverState && !serverState.ok ? (
                <Alert
                  variant="destructive"
                  className="border-destructive/40 bg-destructive/5"
                >
                  <AlertTitle>Unable to run predictor</AlertTitle>
                  <AlertDescription>{serverState.message}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={pending}>
                  {pending ? "Comparing…" : "Run predictor"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {serverState?.ok && serverState.results ? (
        <PredictorResults
          results={serverState.results}
          message={serverState.message}
        />
      ) : null}
    </div>
  );
}

function GpaField({
  control,
  name,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: "bcpGpa" | "overallGpa" | "scienceGpa";
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
              min={2.7}
              max={4}
              placeholder="Optional"
              value={
                field.value === null || field.value === undefined
                  ? ""
                  : String(field.value)
              }
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
