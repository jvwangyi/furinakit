import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const [totalUsage, favoritesCount, recentHistory, topTools] = await Promise.all([
      // Total tool usage count
      prisma.toolUsageHistory.count({ where: { userId: user.id } }),
      // Total favorites
      prisma.favorite.count({ where: { userId: user.id } }),
      // Recent 5 history entries
      prisma.toolUsageHistory.findMany({
        where: { userId: user.id },
        orderBy: { usedAt: 'desc' },
        take: 5,
      }),
      // Top 5 most used tools
      prisma.toolUsageHistory.groupBy({
        by: ['toolName'],
        where: { userId: user.id },
        _count: { toolName: true },
        orderBy: { _count: { toolName: 'desc' } },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsage,
        favoritesCount,
        recentHistory,
        topTools: topTools.map(t => ({
          toolName: t.toolName,
          count: t._count.toolName,
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, 'Get user stats error');
    return NextResponse.json({ success: false, error: '获取统计失败' }, { status: 500 });
  }
}
