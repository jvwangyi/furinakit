import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const toolsRaw = await prisma.toolUsageHistory.groupBy({
    by: ['toolName'],
    _count: { toolName: true },
    _max: { usedAt: true },
    orderBy: { _count: { toolName: 'desc' } },
  });

  const tools = toolsRaw.map((t) => ({
    toolName: t.toolName,
    usageCount: t._count.toolName,
    lastUsedAt: t._max.usedAt,
  }));

  return NextResponse.json({
    success: true,
    data: { tools, totalTools: tools.length },
  });
}
