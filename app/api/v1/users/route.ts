import { prisma } from "@/lib/db";
import { requireAuth, hashPassword, sanitizeUser, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const rows = await prisma.user.findMany({
    where: role ? { role } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return Response.json(rows.map(sanitizeUser));
}

export async function POST(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  if (!b.name || !b.email || !b.password || !b.role) {
    return jsonError(400, "name, email, password and role are required");
  }
  if (!["admin", "staff"].includes(b.role)) return jsonError(400, "Invalid role");
  const exists = await prisma.user.findFirst({
    where: { email: { equals: b.email.trim(), mode: "insensitive" } },
  });
  if (exists) return jsonError(409, "An account with this email already exists");
  const id = b.role + "-" + Date.now();
  const created = await prisma.user.create({
    data: {
      id,
      name: b.name.trim(),
      email: b.email.trim(),
      passwordHash: hashPassword(b.password),
      phone: (b.phone || "").trim(),
      role: b.role,
      rewardPoints: 0,
      active: true,
      createdBy: user.id,
    },
  });
  await auditLog(req, user, "user.create", {
    entityType: "user",
    entityId: id,
    details: { role: b.role, email: b.email },
  });
  return Response.json(sanitizeUser(created), { status: 201 });
}
