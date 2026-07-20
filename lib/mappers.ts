/**
 * mappers.ts — DB row → API shape, matching the original REST responses.
 */
import type { MenuItem, Coupon, Review, Bill, AuditLog } from "@prisma/client";

export const mapMenu = (r: MenuItem) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  description: r.description,
  price: r.price,
  image: r.image,
  rating: r.rating,
  reviewCount: r.reviewCount,
  isVeg: r.isVeg,
  tags: (r.tags as string[]) ?? [],
  available: r.available,
});

export const mapCoupon = (r: Coupon) => ({
  code: r.code,
  type: r.type,
  value: r.value,
  maxDiscount: r.maxDiscount,
  minOrder: r.minOrder,
  category: r.category,
  description: r.description,
  active: r.active,
});

export const mapReview = (r: Review) => ({
  id: r.id,
  dishId: r.dishId,
  rating: r.rating,
  comment: r.comment,
  customerName: r.customerName,
  orderId: r.orderId,
  createdAt: r.createdAt,
});

export const mapBill = (r: Bill) => ({
  id: r.id,
  billNumber: r.billNumber,
  staffId: r.staffId,
  staffName: r.staffName,
  customerName: r.customerName,
  customerPhone: r.customerPhone,
  items: (r.items as { name: string; price: number; quantity: number }[]) ?? [],
  subtotal: r.subtotal,
  discount: r.discount,
  tax: r.tax,
  total: r.total,
  paymentMethod: r.paymentMethod,
  notes: r.notes,
  createdAt: r.createdAt,
});

export const mapAudit = (r: AuditLog) => ({
  id: r.id,
  userId: r.userId,
  userName: r.userName,
  userRole: r.userRole,
  action: r.action,
  entityType: r.entityType,
  entityId: r.entityId,
  details: r.details ? tryParse(r.details) : null,
  ip: r.ip,
  createdAt: r.createdAt,
});

function tryParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
