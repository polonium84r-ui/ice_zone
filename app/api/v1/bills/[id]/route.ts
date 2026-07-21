import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { mapBill } from "@/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;
  const { id } = await params;
  const row = await prisma.bill.findFirst({
    where: { OR: [{ id }, { billNumber: id }] },
  });
  if (!row) return jsonError(404, "Bill not found");

  // Staff can only access their own bills; admin can access all
  if (user.role !== "admin" && row.staffId !== user.id) {
    return jsonError(403, "You do not have permission to view this bill");
  }

  return Response.json(mapBill(row));
}
