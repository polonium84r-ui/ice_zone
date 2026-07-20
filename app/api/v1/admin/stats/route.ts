import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await requireAuth(req, "staff");
  if (user instanceof Response) return user;

  const bills = await prisma.bill.findMany({ select: { total: true, createdAt: true } });
  const menu = await prisma.menuItem.findMany({ select: { rating: true } });
  const coupons = await prisma.coupon.findMany({ select: { active: true } });
  const staffCount = await prisma.user.count({ where: { role: "staff", active: true } });

  const todayStr = new Date().toDateString();
  const isToday = (d: Date) => new Date(d).toDateString() === todayStr;
  const todayBills = bills.filter((bl) => isToday(bl.createdAt));
  const todayRevenue = todayBills.reduce((s, bl) => s + bl.total, 0);
  const avgRating = menu.length
    ? Math.round((menu.reduce((s, m) => s + m.rating, 0) / menu.length) * 10) / 10
    : 0;

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyBills = weekDays.map((day, i) => ({
    day,
    count: bills.filter((bl) => new Date(bl.createdAt).getDay() === i).length,
  }));

  return Response.json({
    todayBills: todayBills.length,
    todayRevenue,
    avgRating,
    activeCoupons: coupons.filter((c) => c.active).length,
    staffCount,
    weeklyBills,
  });
}
