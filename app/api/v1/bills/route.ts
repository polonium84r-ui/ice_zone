import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { mapBill } from "@/lib/mappers";
import {
  generateId,
  truncate,
  clamp,
  isPositiveNumber,
  safeError,
} from "@/lib/security";

const MAX_ITEMS_PER_BILL = 50;
const MAX_CUSTOMER_NAME = 100;
const MAX_PHONE = 20;
const MAX_NOTES = 500;
const MAX_ITEM_NAME = 200;

/**
 * Generate the next sequential bill number. Uses a retry loop to handle
 * the race condition where two concurrent requests could get the same count.
 */
async function nextBillNumber(retries = 3): Promise<string> {
  const today = new Date();
  const ymd =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  for (let attempt = 0; attempt < retries; attempt++) {
    const count = await prisma.bill.count({
      where: { billNumber: { startsWith: `INV-${ymd}-` } },
    });
    const candidate = `INV-${ymd}-${String(count + 1 + attempt).padStart(4, "0")}`;

    // Check if this bill number already exists (handles race condition)
    const existing = await prisma.bill.findUnique({
      where: { billNumber: candidate },
    });
    if (!existing) return candidate;
  }

  // Fallback: use a timestamp suffix to guarantee uniqueness
  return `INV-${ymd}-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;

  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const items = Array.isArray(b.items)
    ? (b.items as { name: string; price: number; quantity: number }[])
    : [];

  if (!items.length) return jsonError(400, "At least one line item is required");
  if (items.length > MAX_ITEMS_PER_BILL) {
    return jsonError(400, `A bill cannot have more than ${MAX_ITEMS_PER_BILL} items`);
  }

  // Validate each line item
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.name || typeof it.name !== "string") {
      return jsonError(400, `Item ${i + 1}: name is required`);
    }
    if (!isPositiveNumber(it.price)) {
      return jsonError(400, `Item ${i + 1}: price must be a positive number`);
    }
    if (!isPositiveNumber(it.quantity) || !Number.isInteger(Number(it.quantity))) {
      return jsonError(400, `Item ${i + 1}: quantity must be a positive integer`);
    }
  }

  // Sanitise items
  const sanitisedItems = items.map((it) => ({
    name: truncate(it.name, MAX_ITEM_NAME),
    price: clamp(Number(it.price), 0.01, 1_000_000),
    quantity: clamp(Math.floor(Number(it.quantity)), 1, 999),
  }));

  const subtotal = sanitisedItems.reduce(
    (s, it) => s + it.price * it.quantity,
    0
  );
  const discount = clamp(Number(b.discount) || 0, 0, subtotal);
  // Not GST-registered — defaults to no tax unless a rate is explicitly sent.
  const taxRate = b.taxRate != null ? clamp(Number(b.taxRate), 0, 1) : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  const total = Math.round((taxable + tax) * 100) / 100;

  // Use cryptographic UUID instead of predictable timestamp
  const id = generateId("bill");
  const billNumber = await nextBillNumber();

  try {
    const row = await prisma.bill.create({
      data: {
        id,
        billNumber,
        staffId: user.id,
        staffName: user.name,
        customerName: truncate(b.customerName || "Walk-in Customer", MAX_CUSTOMER_NAME),
        customerPhone: truncate(b.customerPhone || "", MAX_PHONE),
        items: sanitisedItems,
        subtotal: Math.round(subtotal * 100) / 100,
        discount,
        tax,
        total,
        paymentMethod: truncate(b.paymentMethod || "cash", 30),
        notes: truncate(b.notes || "", MAX_NOTES),
      },
    });
    await auditLog(req, user, "bill.create", {
      entityType: "bill",
      entityId: billNumber,
      details: { total },
    });
    return Response.json(mapBill(row), { status: 201 });
  } catch {
    return safeError(500, "Failed to create bill. Please try again.");
  }
}

export async function GET(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;

  try {
    // staff see their own bills; admin sees all
    const rows = await prisma.bill.findMany({
      where: user.role === "admin" ? undefined : { staffId: user.id },
      orderBy: { createdAt: "desc" },
      take: 500, // Limit results to prevent unbounded queries
    });
    return Response.json(rows.map(mapBill));
  } catch {
    return safeError(500, "Failed to retrieve bills.");
  }
}
