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

export async function GET() {
  try {
    const rows = await prisma.menuItem.findMany({
      where: { available: true },
      orderBy: { id: "asc" },
    });
    return Response.json(rows.map(mapMenu));
  } catch {
    return safeError(500, "Failed to retrieve menu.");
  }
}

export async function POST(req: Request) {
  const user = await requireAuth(req); // admin only
  if (user instanceof Response) return user;

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  if (!b.name || !b.category || !b.price || !b.image) {
    return jsonError(400, "Missing required fields");
  }
  if (!isPositiveNumber(b.price)) {
    return jsonError(400, "Price must be a positive number");
  }
  if (Number(b.price) < MIN_PRICE || Number(b.price) > MAX_PRICE) {
    return jsonError(400, `Price must be between ${MIN_PRICE} and ${MAX_PRICE}`);
  }

  // Validate image URL format
  const imageUrl = truncate(b.image, MAX_IMAGE_URL);
  try {
    new URL(imageUrl);
  } catch {
    return jsonError(400, "Invalid image URL");
  }

  try {
    const row = await prisma.menuItem.create({
      data: {
        name: truncate(b.name, MAX_NAME),
        category: truncate(b.category, MAX_CATEGORY),
        description: truncate(b.description || "", MAX_DESCRIPTION),
        price: clamp(Number(b.price), MIN_PRICE, MAX_PRICE),
        image: imageUrl,
        rating: clamp(Number(b.rating) || 4.0, 0, 5),
        reviewCount: 0,
        isVeg: !!b.isVeg,
        tags: sanitiseTags(b.tags),
        available: true,
      },
    });
    await auditLog(req, user, "menu.create", {
      entityType: "menu",
      entityId: row.id,
      details: { name: row.name },
    });
    return Response.json(mapMenu(row), { status: 201 });
  } catch {
    return safeError(500, "Failed to create menu item. Please try again.");
  }
}
