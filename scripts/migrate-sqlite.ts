/**
 * migrate-sqlite.ts — One-time data migration from the legacy SQLite database
 * (server/data/thirst.db) into PostgreSQL. Copies every row verbatim —
 * users keep their bcrypt password hashes so existing logins keep working,
 * menu items keep their ids, and bills / audit logs are preserved.
 *
 * Run AFTER `prisma migrate dev` has created the tables:
 *   npm run migrate:sqlite
 */
import path from "path";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dbPath = path.join(__dirname, "..", "server", "data", "thirst.db");

/* eslint-disable @typescript-eslint/no-explicit-any */
async function main() {
  const sqlite = new Database(dbPath, { readonly: true });
  const asDate = (s: string) => new Date(s.includes("T") ? s : s + "Z");

  // ---- Users (keep bcrypt hashes → existing passwords keep working) ----
  const users = sqlite.prepare("SELECT * FROM users").all() as any[];
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id, name: u.name, email: u.email, passwordHash: u.password_hash,
        phone: u.phone ?? "", role: u.role, rewardPoints: u.reward_points ?? 0,
        active: !!u.active, createdBy: u.created_by, createdAt: asDate(u.created_at),
      },
    });
  }
  console.log(`Users migrated: ${users.length}`);

  // ---- Menu items (replace seed data with the live menu, same ids) ----
  const menu = sqlite.prepare("SELECT * FROM menu_items ORDER BY id").all() as any[];
  await prisma.menuItem.deleteMany();
  for (const m of menu) {
    await prisma.menuItem.create({
      data: {
        id: m.id, name: m.name, category: m.category, description: m.description ?? "",
        price: m.price, image: m.image, rating: m.rating, reviewCount: m.review_count,
        isVeg: !!m.is_veg, tags: JSON.parse(m.tags || "[]"), available: !!m.available,
        createdAt: asDate(m.created_at),
      },
    });
  }
  // Keep the autoincrement sequence ahead of the copied ids.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('menu_items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM menu_items))`
  );
  console.log(`Menu items migrated: ${menu.length}`);

  // ---- Coupons ----
  const coupons = sqlite.prepare("SELECT * FROM coupons").all() as any[];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code, type: c.type, value: c.value, maxDiscount: c.max_discount,
        minOrder: c.min_order ?? 0, category: c.category, description: c.description ?? "",
        active: !!c.active,
      },
    });
  }
  console.log(`Coupons migrated: ${coupons.length}`);

  // ---- Reviews ----
  const reviews = sqlite.prepare("SELECT * FROM reviews").all() as any[];
  for (const r of reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id, dishId: r.dish_id, rating: r.rating, comment: r.comment,
        customerName: r.customer_name, orderId: r.order_id, createdAt: asDate(r.created_at),
      },
    });
  }
  console.log(`Reviews migrated: ${reviews.length}`);

  // ---- Bills ----
  const bills = sqlite.prepare("SELECT * FROM bills").all() as any[];
  for (const b of bills) {
    await prisma.bill.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id, billNumber: b.bill_number, staffId: b.staff_id, staffName: b.staff_name,
        customerName: b.customer_name, customerPhone: b.customer_phone,
        items: JSON.parse(b.items || "[]"), subtotal: b.subtotal, discount: b.discount,
        tax: b.tax, total: b.total, paymentMethod: b.payment_method, notes: b.notes,
        createdAt: asDate(b.created_at),
      },
    });
  }
  console.log(`Bills migrated: ${bills.length}`);

  // ---- Audit logs ----
  const logs = sqlite.prepare("SELECT * FROM audit_logs ORDER BY id").all() as any[];
  for (const l of logs) {
    await prisma.auditLog.create({
      data: {
        userId: l.user_id, userName: l.user_name, userRole: l.user_role, action: l.action,
        entityType: l.entity_type, entityId: l.entity_id, details: l.details, ip: l.ip,
        createdAt: asDate(l.created_at),
      },
    });
  }
  console.log(`Audit logs migrated: ${logs.length}`);

  sqlite.close();
  console.log("SQLite → PostgreSQL migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
