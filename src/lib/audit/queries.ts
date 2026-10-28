import "server-only";

import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";

import { createDb } from "@/db";
import { auditLogs, users } from "@/db/schema";

export type AuditListFilters = {
  entityType?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AuditListItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: unknown;
  newValues: unknown;
  createdAt: Date;
  actorEmail: string;
  actorName: string | null;
};

export type AuditListResult = {
  items: AuditListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildWhere(filters: AuditListFilters): SQL | undefined {
  const clauses: SQL[] = [];
  if (filters.entityType && filters.entityType !== "all") {
    clauses.push(eq(auditLogs.entityType, filters.entityType));
  }
  const q = filters.q?.trim();
  if (q) {
    clauses.push(ilike(auditLogs.action, `%${q}%`));
  }
  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return and(...clauses);
}

export async function listAuditLogs(
  filters: AuditListFilters = {},
): Promise<AuditListResult> {
  const db = createDb();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const where = buildWhere(filters);

  const [totalRow] = await db
    .select({ value: count() })
    .from(auditLogs)
    .where(where);

  const total = Number(totalRow?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      oldValues: auditLogs.oldValues,
      newValues: auditLogs.newValues,
      createdAt: auditLogs.createdAt,
      actorEmail: users.email,
      actorName: users.name,
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.userId, users.id))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return {
    items: rows,
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}
