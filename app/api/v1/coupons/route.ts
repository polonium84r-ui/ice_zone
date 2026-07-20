import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { mapCoupon } from "@/lib/mappers";

export async function GET() {
  const rows = await prisma.coupon.findMany({ where: { active: true } });
  return Response.json(rows.map(mapCoupon));
}

export async function POST(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!b.code || !b.type || b.value == null) {
    return jsonError(400, "code, type and value are required");
  }
  const code = String(b.code).toUpperCase();
  const row = await prisma.coupon.create({
    data: {
      code,
      type: String(b.type),
      value: Number(b.value),
      maxDiscount: b.maxDiscount != null ? Number(b.maxDiscount) : null,
      minOrder: Number(b.minOrder) || 0,
      category: b.category ? String(b.category) : null,
      description: String(b.description || ""),
      active: b.active === false ? false : true,
    },
  });
  await auditLog(req, user, "coupon.create", { entityType: "coupon", entityId: code });
  return Response.json(mapCoupon(row), { status: 201 });
}
