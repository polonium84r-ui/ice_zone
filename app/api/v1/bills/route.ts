import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { mapBill } from "@/lib/mappers";

async function nextBillNumber() {
  const today = new Date();
  const ymd =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  const count = await prisma.bill.count({
    where: { billNumber: { startsWith: `INV-${ymd}-` } },
  });
  return `INV-${ymd}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const items = Array.isArray(b.items)
    ? (b.items as { name: string; price: number; quantity: number }[])
    : [];
  if (!items.length) return jsonError(400, "At least one line item is required");
  const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
  const discount = Number(b.discount) || 0;
  const taxRate = b.taxRate != null ? Number(b.taxRate) : 0.05;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  const total = Math.round((taxable + tax) * 100) / 100;
  const id = "bill-" + Date.now();
  const billNumber = await nextBillNumber();
  const row = await prisma.bill.create({
    data: {
      id,
      billNumber,
      staffId: user.id,
      staffName: user.name,
      customerName: String(b.customerName || "Walk-in Customer"),
      customerPhone: String(b.customerPhone || ""),
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      tax,
      total,
      paymentMethod: String(b.paymentMethod || "cash"),
      notes: String(b.notes || ""),
    },
  });
  await auditLog(req, user, "bill.create", {
    entityType: "bill",
    entityId: billNumber,
    details: { total },
  });
  return Response.json(mapBill(row), { status: 201 });
}

export async function GET(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;
  // staff see their own bills; admin sees all
  const rows = await prisma.bill.findMany({
    where: user.role === "admin" ? undefined : { staffId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(rows.map(mapBill));
}
