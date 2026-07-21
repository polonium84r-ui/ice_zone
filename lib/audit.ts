/**
 * audit.ts — records every meaningful action to the audit_logs table.
 */
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { extractClientIp, truncate } from "./security";

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
    // Use the security module's IP extraction (validated, sanitised)
    const ip = req ? extractClientIp(req) : null;

    // Truncate details to prevent excessively large audit entries
    const detailsStr = details
      ? typeof details === "string"
        ? truncate(details, 2000)
        : truncate(JSON.stringify(details), 2000)
      : null;

    await prisma.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userName: truncate(user?.name ?? "anonymous", 100),
        userRole: user?.role ?? "guest",
        action: truncate(action, 100),
        entityType: entityType ? truncate(entityType, 50) : null,
        entityId: entityId != null ? truncate(String(entityId), 100) : null,
        details: detailsStr,
        ip,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", action, (err as Error).message);
  }
}
