import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-2xl font-semibold text-primary">Access denied</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        You do not have permission to perform this action. Viewer accounts are
        read-only.
      </p>
      <Link href="/dashboard" className={cn(buttonVariants())}>
        Back to dashboard
      </Link>
    </div>
  );
}
