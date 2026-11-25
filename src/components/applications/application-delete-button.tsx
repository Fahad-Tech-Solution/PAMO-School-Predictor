"use client";

import { useState, useTransition } from "react";

import {
  deleteApplication,
  type ApplicationActionState,
} from "@/actions/applications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function ApplicationDeleteButton({
  applicationId,
  schoolName,
}: {
  applicationId: string;
  schoolName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ApplicationActionState | null>(null);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteApplication(applicationId);
      // redirect() throws; only land here on failure.
      if (result && !result.ok) {
        setError(result);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div>
          <h3 className="text-sm font-semibold text-destructive">
            Delete application
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Permanently remove this school application. The applicant record is
            kept so other school applications stay linked.
          </p>
        </div>
        {error?.message ? (
          <Alert variant="destructive" className="border-destructive/40">
            <AlertTitle>Unable to delete</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          Delete application
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-destructive">
          Confirm deletion
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Delete the application for <span className="font-medium text-foreground">{schoolName}</span>?
          This cannot be undone.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={onDelete}
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
