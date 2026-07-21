import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { mapMenu } from "@/lib/mappers";
import {
  truncate,
  clamp,
  sanitiseTags,
  isPositiveNumber,
  safeError,
} from "@/lib/security";

const MAX_NAME = 200;
const MAX_CATEGORY = 100;
const MAX_DESCRIPTION = 1000;
const MAX_IMAGE_URL = 2048;
const MIN_PRICE = 0.01;
const MAX_PRICE = 100_000;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return jsonError(400, "Invalid item ID");
  }
  const row = await prisma.menuItem.findUnique({ where: { id: parsedId } });
  if (!row) return jsonError(404, "Item not found");
  return Response.json(mapMenu(row));
}

export async function PUT(req: Request, { params }: Ctx) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError(400, "Invalid item ID");
  }
  const cur = await prisma.menuItem.findUnique({ where: { id } });
  if (!cur) return jsonError(404, "Item not found");

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  // Validate price if provided
  if (b.price != null) {
    if (!isPositiveNumber(b.price)) {
      return jsonError(400, "Price must be a positive number");
    }
    if (Number(b.price) < MIN_PRICE || Number(b.price) > MAX_PRICE) {
      return jsonError(400, `Price must be between ${MIN_PRICE} and ${MAX_PRICE}`);
    }
  }

  // Validate image URL if provided
  if (b.image != null) {
    const imageUrl = truncate(b.image, MAX_IMAGE_URL);
    try {
      new URL(imageUrl);
    } catch {
      return jsonError(400, "Invalid image URL");
    }
  }

  try {
    const row = await prisma.menuItem.update({
      where: { id },
      data: {
        name: b.name != null ? truncate(b.name, MAX_NAME) : cur.name,
        category: b.category != null ? truncate(b.category, MAX_CATEGORY) : cur.category,
        description: b.description != null ? truncate(b.description, MAX_DESCRIPTION) : cur.description,
        price: b.price != null ? clamp(Number(b.price), MIN_PRICE, MAX_PRICE) : cur.price,
        image: b.image != null ? truncate(b.image, MAX_IMAGE_URL) : cur.image,
        isVeg: b.isVeg != null ? !!b.isVeg : cur.isVeg,
        tags: b.tags != null ? sanitiseTags(b.tags) : (cur.tags as string[]),
        available: b.available != null ? !!b.available : cur.available,
      },
    });
    await auditLog(req, user, "menu.update", {
      entityType: "menu",
      entityId: id,
      details: { name: row.name },
    });
    return Response.json(mapMenu(row));
  } catch {
    return safeError(500, "Failed to update menu item. Please try again.");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError(400, "Invalid item ID");
  }
  const row = await prisma.menuItem.findUnique({ where: { id } });
  if (!row) return jsonError(404, "Item not found");

  try {
    await prisma.menuItem.delete({ where: { id } });
    await auditLog(req, user, "menu.delete", {
      entityType: "menu",
      entityId: id,
      details: { name: row.name },
    });
    return Response.json({ ok: true });
  } catch {
    return safeError(500, "Failed to delete menu item. Please try again.");
  }
}
