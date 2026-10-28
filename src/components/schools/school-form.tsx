"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  createSchool,
  updateSchool,
  type SchoolActionState,
} from "@/actions/schools";
import { invalidateSchoolCatalogClientCache } from "@/components/schools/school-selector";
import { StateCombobox } from "@/components/schools/state-combobox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { School } from "@/db/schema";

const initialState: SchoolActionState = { ok: false, message: "" };

type SchoolFormProps = {
  mode: "create" | "edit";
  school?: School;
};

export function SchoolForm({ mode, school }: SchoolFormProps) {
  const action =
    mode === "create" ? createSchool : updateSchool.bind(null, school!.id);

  const [state, formAction, pending] = useActionState(action, initialState);
  const toastedKey = useRef<number | null>(null);

  // Remount create form after success so inputs/checkboxes reset to defaults.
  const formKey =
    mode === "create" ? `create-${state.resetKey ?? 0}` : `edit-${school?.id}`;

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      if (state.resetKey && toastedKey.current === state.resetKey) return;
      if (state.resetKey) toastedKey.current = state.resetKey;
      invalidateSchoolCatalogClientCache();
      toast.success(state.message, {
        description:
          mode === "create"
            ? "Form cleared — ready for another school."
            : undefined,
        position: "bottom-right",
      });
    } else {
      toast.error(state.message, { position: "bottom-right" });
    }
  }, [state.message, state.ok, state.resetKey, mode]);

  return (
    <form key={formKey} action={formAction} className="w-full space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">School name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={mode === "edit" ? (school?.name ?? "") : ""}
          placeholder="University PA Program"
          autoComplete="off"
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-xs font-medium text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>

      <div className="relative z-20 space-y-1.5">
        <Label htmlFor="state">State</Label>
        <StateCombobox
          id="state"
          name="state"
          defaultValue={mode === "edit" ? (school?.state ?? "") : ""}
          placeholder="Search state…"
        />
        {state.fieldErrors?.state?.[0] ? (
          <p className="text-xs font-medium text-destructive">
            {state.fieldErrors.state[0]}
          </p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="requiresGre"
          value="true"
          defaultChecked={
            mode === "edit" ? (school?.requiresGre ?? false) : false
          }
          className="size-4 rounded border-input"
        />
        Program requires GRE
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={mode === "edit" ? (school?.isActive ?? true) : true}
          className="size-4 rounded border-input"
        />
        Active
      </label>

      {state.message && !state.ok ? (
        <Alert
          variant="destructive"
          className="border-destructive/40 bg-destructive/5"
        >
          <AlertTitle>Unable to save</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end pt-1">
        <Button type="submit" size="default" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create school"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
