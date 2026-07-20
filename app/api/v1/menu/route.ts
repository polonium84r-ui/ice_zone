import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { mapMenu } from "@/lib/mappers";

export async function GET() {
  const rows = await prisma.menuItem.findMany({
    where: { available: true },
    orderBy: { id: "asc" },
  });
  return Response.json(rows.map(mapMenu));
}

export async function POST(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!b.name || !b.category || !b.price || !b.image) {
    return jsonError(400, "Missing required fields");
  }
  const row = await prisma.menuItem.create({
    data: {
      name: String(b.name),
      category: String(b.category),
      description: String(b.description || ""),
      price: Number(b.price),
      image: String(b.image),
      rating: Number(b.rating) || 4.0,
      reviewCount: 0,
      isVeg: !!b.isVeg,
      tags: Array.isArray(b.tags) ? b.tags : [],
      available: true,
    },
  });
  await auditLog(req, user, "menu.create", {
    entityType: "menu",
    entityId: row.id,
    details: { name: row.name },
  });
  return Response.json(mapMenu(row), { status: 201 });
}
