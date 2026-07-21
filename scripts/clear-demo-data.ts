/**
 * clear-demo-data.ts — Permanently removes all test/demo/mock data from the database.
 *
 * Operations performed:
 * 1. Deletes all test bills (POS transactions created during development)
 * 2. Deletes all test reviews
 * 3. Deletes all test audit logs
 * 4. Resets menu items' rating to 5.0 and reviewCount to 0
 * 5. Clears metadata so `npm run seed` will re-seed clean menu defaults
 *
 * Usage: npx tsx scripts/clear-demo-data.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all test / demo / mock data from database...");

  // 1. Delete all test bills
  const deletedBills = await prisma.bill.deleteMany();
  console.log(`  ✓ Removed ${deletedBills.count} test bill(s)`);

  // 2. Delete all test reviews
  const deletedReviews = await prisma.review.deleteMany();
  console.log(`  ✓ Removed ${deletedReviews.count} test review(s)`);

  // 3. Delete all test audit logs
  const deletedAuditLogs = await prisma.auditLog.deleteMany();
  console.log(`  ✓ Removed ${deletedAuditLogs.count} test audit log(s)`);

  // 4. Reset menu item review counts to 0 and rating to 5.0
  const updatedMenu = await prisma.menuItem.updateMany({
    data: {
      reviewCount: 0,
      rating: 5.0,
    },
  });
  console.log(`  ✓ Reset review counts & ratings for ${updatedMenu.count} menu item(s)`);

  // 5. Reset menu version metadata to force a fresh seed if needed
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM _meta WHERE key = 'menu_version'`);
    console.log("  ✓ Reset menu seed version metadata");
  } catch {
    // metadata table might not exist yet
  }

  console.log("✨ All demo / mock / test data permanently removed!");
}

main()
  .catch((err) => {
    console.error("❌ Error clearing demo data:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
