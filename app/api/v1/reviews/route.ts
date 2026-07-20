import { prisma } from "@/lib/db";
import { mapReview } from "@/lib/mappers";

// Read-only — shown on the public menu; no customer submission.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dishId = searchParams.get("dishId");
  const rows = await prisma.review.findMany({
    where: dishId ? { dishId: Number(dishId) } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return Response.json(rows.map(mapReview));
}
