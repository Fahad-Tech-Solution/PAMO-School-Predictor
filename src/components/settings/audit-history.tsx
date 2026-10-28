"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { signalNavigationStart } from "@/components/layout/navigation-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuditListResult } from "@/lib/audit/queries";

function entityHref(entityType: string, entityId: string): string | null {
  switch (entityType) {
    case "school":
      return `/schools/${entityId}`;
    case "application":
      return `/applications/${entityId}`;
    case "applicant":
      return `/applicants/${entityId}`;
    default:
      return null;
  }
}

export function AuditHistory({ result }: { result: AuditListResult }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);

  const entityType = searchParams.get("entityType") ?? "all";
  const q = searchParams.get("q") ?? "";

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    });
    params.delete("page");
    signalNavigationStart();
    startTransition(() => {
      router.push(`/settings?${params.toString()}#audit`);
    });
  }

  function goPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    signalNavigationStart();
    startTransition(() => {
      router.push(`/settings?${params.toString()}#audit`);
    });
  }

  return (
    <section id="audit" className="space-y-4 scroll-mt-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Audit history</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Administrative changes are logged for accountability.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-lg border border-border bg-white p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          apply({
            q: String(form.get("q") ?? "").trim(),
            entityType: String(form.get("entityType") ?? "all"),
          });
        }}
      >
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="audit-q">Action contains</Label>
          <Input
            id="audit-q"
            name="q"
            defaultValue={q}
            placeholder="e.g. CREATE SCHOOL"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="entityType">Entity</Label>
          <select
            id="entityType"
            name="entityType"
            defaultValue={entityType}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="all">All</option>
            <option value="school">School</option>
            <option value="application">Application</option>
            <option value="applicant">Applicant</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Filtering…" : "Filter"}
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No audit events match these filters.
                </td>
              </tr>
            ) : (
              result.items.map((row) => {
                const href = entityHref(row.entityType, row.entityId);
                const open = expanded === row.id;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 align-top"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {row.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{row.actorEmail}</td>
                    <td className="px-4 py-3 font-medium">{row.action}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-muted-foreground">
                        {row.entityType}
                      </span>
                      <br />
                      {href ? (
                        <Link
                          href={href}
                          className="text-primary hover:underline"
                        >
                          {row.entityId.slice(0, 8)}…
                        </Link>
                      ) : (
                        <span className="font-mono text-[11px]">
                          {row.entityId.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpanded((prev) => (prev === row.id ? null : row.id))
                        }
                      >
                        {open ? "Hide" : "Show"}
                      </Button>
                      {open ? (
                        <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted/40 p-2 text-[11px] leading-relaxed">
                          {JSON.stringify(
                            {
                              oldValues: row.oldValues,
                              newValues: row.newValues,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          {result.total} event{result.total === 1 ? "" : "s"} · Page{" "}
          {result.page} of {result.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || result.page <= 1}
            onClick={() => goPage(result.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || result.page >= result.totalPages}
            onClick={() => goPage(result.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
