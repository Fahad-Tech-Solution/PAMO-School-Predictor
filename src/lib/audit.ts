import "server-only";

import { createDb } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditInput = {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const db = createDb();
  await db.insert(auditLogs).values({
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValues: input.oldValues ?? null,
    newValues: input.newValues ?? null,
  });
}
