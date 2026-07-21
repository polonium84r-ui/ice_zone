import { prisma } from "@/lib/db";
import { requireAuth, jsonError } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { mapCoupon } from "@/lib/mappers";
import {
  truncate,
  clamp,
  isPositiveNumber,
  isNonNegativeNumber,
  safeError,
} from "@/lib/security";

const MAX_CODE = 30;
const MAX_DESCRIPTION = 200;
const MAX_CATEGORY = 100;
const VALID_COUPON_TYPES = ["percentage", "flat"] as const;

export async function GET() {
  try {
    const rows = await prisma.coupon.findMany({ where: { active: true } });
    return Response.json(rows.map(mapCoupon));
  } catch {
    return safeError(500, "Failed to retrieve coupons.");
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

  if (!b.code || !b.type || b.value == null) {
    return jsonError(400, "code, type and value are required");
  }

  // Validate coupon type
  const couponType = String(b.type);
  if (!VALID_COUPON_TYPES.includes(couponType as typeof VALID_COUPON_TYPES[number])) {
    return jsonError(400, "Coupon type must be 'percentage' or 'flat'");
  }

  // Validate value is positive
  if (!isPositiveNumber(b.value)) {
    return jsonError(400, "Coupon value must be a positive number");
  }

  // For percentage coupons, clamp to 0-100
  const value =
    couponType === "percentage"
      ? clamp(Number(b.value), 0.01, 100)
      : clamp(Number(b.value), 0.01, 1_000_000);

  // Validate minOrder is non-negative
  if (b.minOrder != null && !isNonNegativeNumber(b.minOrder)) {
    return jsonError(400, "Minimum order must be a non-negative number");
  }

  // Validate maxDiscount is positive if provided
  if (b.maxDiscount != null && !isPositiveNumber(b.maxDiscount)) {
    return jsonError(400, "Maximum discount must be a positive number");
  }

  const code = truncate(b.code, MAX_CODE).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!code) {
    return jsonError(400, "Coupon code must contain only letters, numbers, hyphens, or underscores");
  }

  // Check if coupon already exists
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return jsonError(409, "A coupon with this code already exists");
  }

  try {
    const row = await prisma.coupon.create({
      data: {
        code,
        type: couponType,
        value,
        maxDiscount: b.maxDiscount != null ? clamp(Number(b.maxDiscount), 0, 1_000_000) : null,
        minOrder: clamp(Number(b.minOrder) || 0, 0, 1_000_000),
        category: b.category ? truncate(b.category, MAX_CATEGORY) : null,
        description: truncate(b.description || "", MAX_DESCRIPTION),
        active: b.active === false ? false : true,
      },
    });
    await auditLog(req, user, "coupon.create", { entityType: "coupon", entityId: code });
    return Response.json(mapCoupon(row), { status: 201 });
  } catch {
    return safeError(500, "Failed to create coupon. Please try again.");
  }
}
