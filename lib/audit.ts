/**
 * audit.ts — records every meaningful action to the audit_logs table.
 */
import type { User } from "@prisma/client";
import { prisma } from "./db";

type AuditOpts = {
  entityType?: string | null;
  entityId?: string | number | null;
  details?: unknown;
};

/**
 * log(req, user, action, opts) — falls back to an anonymous actor when no
 * authenticated user is given. Never lets audit failures break the request.
 */
export async function auditLog(
  req: Request | null,
  user: User | null,
  action: string,
  { entityType = null, entityId = null, details = null }: AuditOpts = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userName: user?.name ?? "anonymous",
        userRole: user?.role ?? "guest",
        action,
        entityType,
        entityId: entityId != null ? String(entityId) : null,
        details: details
          ? typeof details === "string"
            ? details
            : JSON.stringify(details)
          : null,
        ip: req ? req.headers.get("x-forwarded-for") : null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", action, (err as Error).message);
  }
}
