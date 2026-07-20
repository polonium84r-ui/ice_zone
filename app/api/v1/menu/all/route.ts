import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { mapMenu } from "@/lib/mappers";

export async function GET(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;
  const rows = await prisma.menuItem.findMany({ orderBy: { id: "asc" } });
  return Response.json(rows.map(mapMenu));
}
