import { prisma } from "@/lib/db";
import { requireAuth, hashPassword, sanitizeUser, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { id } = await params;
  const cur = await prisma.user.findUnique({ where: { id } });
  if (!cur) return jsonError(404, "User not found");
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (b.role && !["admin", "staff"].includes(String(b.role))) {
    return jsonError(400, "Invalid role");
  }
  // Guard: don't let the last active admin be demoted or disabled.
  if (cur.role === "admin" && ((b.role && b.role !== "admin") || b.active === false)) {
    const admins = await prisma.user.count({ where: { role: "admin", active: true } });
    if (admins <= 1) return jsonError(400, "Cannot demote or disable the last active admin");
  }
  await prisma.user.update({
    where: { id },
    data: {
      name: b.name != null ? String(b.name) : cur.name,
      phone: b.phone != null ? String(b.phone) : cur.phone,
      role: b.role != null ? String(b.role) : cur.role,
      active: b.active != null ? !!b.active : cur.active,
      ...(b.password ? { passwordHash: hashPassword(String(b.password)) } : {}),
    },
  });
  await auditLog(req, user, "user.update", {
    entityType: "user",
    entityId: id,
    details: { role: b.role, active: b.active },
  });
  const updated = await prisma.user.findUnique({ where: { id } });
  return Response.json(sanitizeUser(updated));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { id } = await params;
  const cur = await prisma.user.findUnique({ where: { id } });
  if (!cur) return jsonError(404, "User not found");
  if (cur.id === user.id) return jsonError(400, "You cannot disable your own account");
  if (cur.role === "admin") {
    const admins = await prisma.user.count({ where: { role: "admin", active: true } });
    if (admins <= 1) return jsonError(400, "Cannot disable the last active admin");
  }
  // soft-disable preserves history
  await prisma.user.update({ where: { id }, data: { active: false } });
  await auditLog(req, user, "user.disable", {
    entityType: "user",
    entityId: id,
    details: { email: cur.email },
  });
  return Response.json({ ok: true });
}
