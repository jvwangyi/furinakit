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

  const [totalUsers, totalUsage, topToolsRaw] = await Promise.all([
    prisma.user.count(),
    prisma.toolUsageHistory.count(),
    prisma.toolUsageHistory.groupBy({
      by: ['toolName'],
      _count: { toolName: true },
      orderBy: { _count: { toolName: 'desc' } },
      take: 10,
    }),
  ]);

  const topTools = topToolsRaw.map((t) => ({
    toolName: t.toolName,
    count: t._count.toolName,
  }));

  return NextResponse.json({
    success: true,
    data: { totalUsers, totalUsage, topTools },
  });
}
