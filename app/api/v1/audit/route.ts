import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { mapAudit } from "@/lib/mappers";
import { safeError } from "@/lib/security";

export async function GET(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit")) || 200), 1000);
  const action = searchParams.get("action");

  try {
    const rows = await prisma.auditLog.findMany({
      where: action ? { action: { startsWith: action } } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return Response.json(rows.map(mapAudit));
  } catch {
    return safeError(500, "Failed to retrieve audit logs.");
  }
}
