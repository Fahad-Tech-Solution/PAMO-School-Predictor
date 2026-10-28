"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  useFormContext,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";

import { getSchoolsByIdsAction } from "@/actions/schools";
import { SchoolSelector } from "@/components/schools/school-selector";
import { StateCombobox } from "@/components/schools/state-combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ApplicationFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  includeHomeState?: boolean;
  /** Multi-select schools (create flows). Default false = single schoolId. */
  multiSchool?: boolean;
  schoolDefaultLabel?: string | null;
  /** Include inactive schools in search (edit / historical). Create stays active-only. */
  includeInactiveSchools?: boolean;
  /** Predictor-style multi-card layout. */
  layout?: "stack" | "cards";
};

type SchoolOutcomeDraft = {
  schoolId: string;
  applicationAttempt: number;
  status: "UNKNOWN" | "ACCEPTED" | "NOT_ACCEPTED" | "WAITLISTED";
};

function syncSchoolOutcomes(
  schoolIds: string[],
  current: SchoolOutcomeDraft[] | undefined,
): SchoolOutcomeDraft[] {
  const byId = new Map((current ?? []).map((row) => [row.schoolId, row]));
  return schoolIds.map(
    (id) =>
      byId.get(id) ?? {
        schoolId: id,
        applicationAttempt: 1,
        status: "UNKNOWN",
      },
  );
}

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-visible bg-white", className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold text-primary">
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4 overflow-visible pt-4">
        {children}
      </CardContent>
    </Card>
  );
}

function HomeStateField<T extends FieldValues>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <FormField
      control={control}
      name={"homeState" as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Applicant home state</FormLabel>
          <StateCombobox
            name="homeState"
            value={field.value as string}
            onChange={field.onChange}
            placeholder="Select one state…"
          />
          <FormDescription>
            Exactly one home state for this anonymous applicant.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function MultiSchoolField<T extends FieldValues>({
  control,
  includeInactiveSchools,
}: {
  control: Control<T>;
  includeInactiveSchools: boolean;
}) {
  const { getValues, setValue } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={"schoolIds" as Path<T>}
      render={({ field }) => (
        <FormItem>
          <SchoolSelector
            multiple
            name="schoolIds"
            label=""
            value={(field.value as string[]) ?? []}
            onChange={(ids) => {
              field.onChange(ids);
              // Sync outcomes in the same turn so submit cannot race useEffect.
              const current = getValues("schoolOutcomes" as Path<T>) as
                | SchoolOutcomeDraft[]
                | undefined;
              setValue(
                "schoolOutcomes" as Path<T>,
                syncSchoolOutcomes(ids, current) as never,
                { shouldDirty: true, shouldValidate: false },
              );
            }}
            includeInactive={includeInactiveSchools}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SchoolField<T extends FieldValues>({
  control,
  multiSchool,
  schoolDefaultLabel,
  includeInactiveSchools,
}: {
  control: Control<T>;
  multiSchool: boolean;
  schoolDefaultLabel: string | null;
  includeInactiveSchools: boolean;
}) {
  if (multiSchool) {
    return (
      <MultiSchoolField
        control={control}
        includeInactiveSchools={includeInactiveSchools}
      />
    );
  }

  return (
    <FormField
      control={control}
      name={"schoolId" as Path<T>}
      render={({ field }) => (
        <FormItem>
          <SchoolSelector
            name="schoolId"
            label=""
            value={(field.value as string) || null}
            defaultLabel={schoolDefaultLabel}
            onChange={(id) => field.onChange(id ?? "")}
            includeInactive={includeInactiveSchools}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function GpaAndPceFields<T extends FieldValues>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={control}
          name={"bcpGpa" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>BCP GPA</FormLabel>
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
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={"overallGpa" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall GPA</FormLabel>
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
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={"scienceGpa" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Science GPA</FormLabel>
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
        control={control}
        name={"pceHours" as Path<T>}
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
                onBlur={field.onBlur}
                name={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function AttemptField<T extends FieldValues>({
  control,
  name = "applicationAttempt" as Path<T>,
}: {
  control: Control<T>;
  name?: Path<T>;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Application attempt</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              step={1}
              value={
                field.value === null || field.value === undefined
                  ? "1"
                  : String(field.value)
              }
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
            />
          </FormControl>
          <FormDescription>1st, 2nd, 3rd… no maximum.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function StatusField<T extends FieldValues>({
  control,
  name = "status" as Path<T>,
}: {
  control: Control<T>;
  name?: Path<T>;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = String(field.value ?? "UNKNOWN");
        const options = [
          { value: "UNKNOWN", label: "Unknown" },
          { value: "ACCEPTED", label: "Accepted" },
          { value: "NOT_ACCEPTED", label: "Not accepted" },
          { value: "WAITLISTED", label: "Waitlisted" },
        ] as const;

        return (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <input type="hidden" name={field.name} value={selected} />
            <div
              role="radiogroup"
              aria-label="Application status"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {options.map((option) => {
                const isSelected = selected === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => field.onChange(option.value)}
                    onBlur={field.onBlur}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-3 text-center text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-white text-foreground hover:bg-muted/50",
                    )}
                  >
                    {isSelected ? (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={16}
                        strokeWidth={2.2}
                      />
                    ) : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
            <FormDescription>
              Unknown is stored as empty status — not the same as Not accepted.
              Select one option only.
            </FormDescription>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function PerSchoolStatusAttemptFields<T extends FieldValues>({
  control,
}: {
  control: Control<T>;
}) {
  const { setValue, getValues } = useFormContext<T>();
  const schoolIds =
    (useWatch({ control, name: "schoolIds" as Path<T> }) as
      | string[]
      | undefined) ?? [];
  const [labels, setLabels] = useState<Record<string, string>>({});

  // Safety net if schoolIds change outside MultiSchoolField onChange.
  useEffect(() => {
    const current =
      (getValues("schoolOutcomes" as Path<T>) as
        | SchoolOutcomeDraft[]
        | undefined) ?? [];
    const next = syncSchoolOutcomes(schoolIds, current);
    const sameOrder =
      next.length === current.length &&
      next.every((row, index) => row.schoolId === current[index]?.schoolId);
    if (!sameOrder) {
      setValue("schoolOutcomes" as Path<T>, next as never, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [schoolIds, getValues, setValue]);

  useEffect(() => {
    if (schoolIds.length === 0) {
      setLabels({});
      return;
    }

    let cancelled = false;
    void getSchoolsByIdsAction(schoolIds).then((rows) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const row of rows) {
        next[row.id] = `${row.name} (${row.state})`;
      }
      setLabels(next);
    });

    return () => {
      cancelled = true;
    };
  }, [schoolIds]);

  if (schoolIds.length === 0) {
    return (
      <FormField
        control={control}
        name={"schoolOutcomes" as Path<T>}
        render={() => (
          <FormItem>
            <p className="text-sm text-muted-foreground">
              Select one or more schools above to set status and attempt for
              each.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={"schoolOutcomes" as Path<T>}
        render={() => (
          <FormItem className="space-y-0">
            <FormMessage />
          </FormItem>
        )}
      />
      {schoolIds.map((schoolId, index) => (
        <div
          key={schoolId}
          className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
        >
          <p className="text-sm font-semibold text-foreground">
            {labels[schoolId] ?? "Selected school"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <AttemptField
              control={control}
              name={`schoolOutcomes.${index}.applicationAttempt` as Path<T>}
            />
            <div className="sm:col-span-2">
              <StatusField
                control={control}
                name={`schoolOutcomes.${index}.status` as Path<T>}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ApplicationFields<T extends FieldValues>({
  control,
  includeHomeState = false,
  multiSchool = false,
  schoolDefaultLabel = null,
  includeInactiveSchools = false,
  layout = "stack",
}: ApplicationFieldsProps<T>) {
  const schoolField = (
    <SchoolField
      control={control}
      multiSchool={multiSchool}
      schoolDefaultLabel={schoolDefaultLabel}
      includeInactiveSchools={includeInactiveSchools}
    />
  );

  const statusAttemptFields = multiSchool ? (
    <PerSchoolStatusAttemptFields control={control} />
  ) : (
    <div className="grid gap-4 sm:grid-cols-2">
      <AttemptField control={control} />
      <div className="sm:col-span-2">
        <StatusField control={control} />
      </div>
    </div>
  );

  if (layout === "cards") {
    const schoolTitle = multiSchool ? "Schools" : "School";
    const schoolDescription = multiSchool
      ? "Select one or more schools. One application is created per school, each with its own status and attempt."
      : includeInactiveSchools
        ? "Active and inactive schools can be selected for historical edits."
        : "Select the PA program for this application.";

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {includeHomeState ? (
            <SectionCard
              title="Home state"
              description="Used to derive in-state / out-of-state vs each school."
            >
              <HomeStateField control={control} />
            </SectionCard>
          ) : (
            <SectionCard title={schoolTitle} description={schoolDescription}>
              {schoolField}
            </SectionCard>
          )}

          <SectionCard
            title="GPAs & PCE"
            description="Optional academic inputs shared across the selected schools."
          >
            <GpaAndPceFields control={control} />
          </SectionCard>
        </div>

        {includeHomeState ? (
          <SectionCard title={schoolTitle} description={schoolDescription}>
            {schoolField}
          </SectionCard>
        ) : null}

        <SectionCard
          title={multiSchool ? "Status & attempt by school" : "Status & attempt"}
          description={
            multiSchool
              ? "Set outcome and attempt number separately for each selected school."
              : "Outcome and how many times this applicant applied to this school."
          }
        >
          {statusAttemptFields}
        </SectionCard>
      </div>
    );
  }

  return (
    <>
      {includeHomeState ? <HomeStateField control={control} /> : null}
      {schoolField}
      <GpaAndPceFields control={control} />
      {multiSchool ? (
        statusAttemptFields
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <AttemptField control={control} />
          </div>
          <StatusField control={control} />
        </>
      )}
    </>
  );
}
