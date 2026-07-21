import { prisma } from "@/lib/db";
import { mapReview } from "@/lib/mappers";
import { safeError } from "@/lib/security";

const MAX_REVIEWS_PER_REQUEST = 200;

// Read-only — shown on the public menu; no customer submission.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dishId = searchParams.get("dishId");
  const limitParam = Number(searchParams.get("limit")) || MAX_REVIEWS_PER_REQUEST;
  const limit = Math.min(Math.max(1, limitParam), MAX_REVIEWS_PER_REQUEST);

  try {
    const rows = await prisma.review.findMany({
      where: dishId ? { dishId: Number(dishId) } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return Response.json(rows.map(mapReview));
  } catch {
    return safeError(500, "Failed to retrieve reviews.");
  }
}
