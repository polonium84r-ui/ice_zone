import { prisma } from "@/lib/db";
import { requireAuth, hashPassword, sanitizeUser, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { truncate, validatePasswordStrength, safeError } from "@/lib/security";

const MAX_NAME = 100;
const MAX_PHONE = 20;

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { id } = await params;
  const cur = await prisma.user.findUnique({ where: { id } });
  if (!cur) return jsonError(404, "User not found");

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  if (b.role && !["admin", "staff"].includes(String(b.role))) {
    return jsonError(400, "Invalid role");
  }

  // Enforce password strength on password change
  if (b.password) {
    const passwordError = validatePasswordStrength(String(b.password));
    if (passwordError) return jsonError(400, passwordError);
  }

  // Guard: don't let the last active admin be demoted or disabled.
  if (cur.role === "admin" && ((b.role && b.role !== "admin") || b.active === false)) {
    const admins = await prisma.user.count({ where: { role: "admin", active: true } });
    if (admins <= 1) return jsonError(400, "Cannot demote or disable the last active admin");
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: b.name != null ? truncate(b.name, MAX_NAME).trim() : cur.name,
        phone: b.phone != null ? truncate(b.phone, MAX_PHONE).trim() : cur.phone,
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
  } catch {
    return safeError(500, "Failed to update user. Please try again.");
  }
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

  try {
    // soft-disable preserves history
    await prisma.user.update({ where: { id }, data: { active: false } });
    await auditLog(req, user, "user.disable", {
      entityType: "user",
      entityId: id,
      details: { email: cur.email },
    });
    return Response.json({ ok: true });
  } catch {
    return safeError(500, "Failed to disable user. Please try again.");
  }
}
