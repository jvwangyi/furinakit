import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats — Dashboard statistics
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalToolUsage,
    toolUsageToday,
    totalFavorites,
    topTools,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.toolUsageHistory.count(),
    prisma.toolUsageHistory.count({
      where: { usedAt: { gte: todayStart } },
    }),
    prisma.favorite.count(),
    prisma.toolUsageHistory.groupBy({
      by: ['toolName'],
      _count: { toolName: true },
      orderBy: { _count: { toolName: 'desc' } },
      take: 10,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  // Today's active users (distinct users who used any tool today)
  const todayActiveUsers = await prisma.toolUsageHistory.findMany({
    where: { usedAt: { gte: todayStart } },
    distinct: ['userId'],
    select: { userId: true },
  });

  // Daily usage trend for last 30 days
  const allUsage = await prisma.toolUsageHistory.findMany({
    where: { usedAt: { gte: monthAgo } },
    select: { usedAt: true },
  });

  // Group by date
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, 0);
  }
  for (const u of allUsage) {
    const key = new Date(u.usedAt).toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, dailyMap.get(key)! + 1);
    }
  }
  const dailyTrend = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalToolUsage,
        toolUsageToday,
        todayActiveUsers: todayActiveUsers.length,
        totalFavorites,
      },
      topTools: topTools.map((t) => ({
        toolName: t.toolName,
        count: t._count.toolName,
      })),
      dailyTrend,
      recentUsers,
    },
  });
}
