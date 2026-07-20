import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { mapMenu } from "@/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await prisma.menuItem.findUnique({ where: { id: Number(id) } });
  if (!row) return jsonError(404, "Item not found");
  return Response.json(mapMenu(row));
}

export async function PUT(req: Request, { params }: Ctx) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { id: idStr } = await params;
  const id = Number(idStr);
  const cur = await prisma.menuItem.findUnique({ where: { id } });
  if (!cur) return jsonError(404, "Item not found");
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const row = await prisma.menuItem.update({
    where: { id },
    data: {
      name: b.name != null ? String(b.name) : cur.name,
      category: b.category != null ? String(b.category) : cur.category,
      description: b.description != null ? String(b.description) : cur.description,
      price: b.price != null ? Number(b.price) : cur.price,
      image: b.image != null ? String(b.image) : cur.image,
      isVeg: b.isVeg != null ? !!b.isVeg : cur.isVeg,
      tags: b.tags != null && Array.isArray(b.tags) ? b.tags : (cur.tags as string[]),
      available: b.available != null ? !!b.available : cur.available,
    },
  });
  await auditLog(req, user, "menu.update", {
    entityType: "menu",
    entityId: id,
    details: { name: row.name },
  });
  return Response.json(mapMenu(row));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { id: idStr } = await params;
  const id = Number(idStr);
  const row = await prisma.menuItem.findUnique({ where: { id } });
  if (!row) return jsonError(404, "Item not found");
  await prisma.menuItem.delete({ where: { id } });
  await auditLog(req, user, "menu.delete", {
    entityType: "menu",
    entityId: id,
    details: { name: row.name },
  });
  return Response.json({ ok: true });
}
