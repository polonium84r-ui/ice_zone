import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { safeError } from "@/lib/security";

export async function GET(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;

  try {
    // Use DB-level date filtering instead of loading all bills into memory
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's bills — filtered at the database level
    const todayBills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
      select: { total: true },
    });
    const todayRevenue = todayBills.reduce((s, bl) => s + bl.total, 0);

    // Average rating — aggregated at DB level
    const ratingAgg = await prisma.menuItem.aggregate({
      _avg: { rating: true },
    });
    const avgRating = ratingAgg._avg.rating
      ? Math.round(ratingAgg._avg.rating * 10) / 10
      : 0;

    // Active coupons count
    const activeCoupons = await prisma.coupon.count({ where: { active: true } });

    // Staff count
    const staffCount = await prisma.user.count({
      where: { role: "staff", active: true },
    });

    // Weekly bills — use DB-level filtering for the past 7 days
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekBills = await prisma.bill.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true },
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyBills = weekDays.map((day, i) => ({
      day,
      count: weekBills.filter((bl) => new Date(bl.createdAt).getDay() === i)
        .length,
    }));

    return Response.json({
      todayBills: todayBills.length,
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      avgRating,
      activeCoupons,
      staffCount,
      weeklyBills,
    });
  } catch {
    return safeError(500, "Failed to retrieve statistics.");
  }
}
