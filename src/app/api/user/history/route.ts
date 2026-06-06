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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const toolName = searchParams.get('tool');

    const where: any = { userId: user.id };
    if (toolName) where.toolName = toolName;

    const [history, total] = await Promise.all([
      prisma.toolUsageHistory.findMany({
        where,
        orderBy: { usedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.toolUsageHistory.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: history,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error({ err }, 'Get history error');
    return NextResponse.json({ success: false, error: '获取历史记录失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { toolName } = await request.json();
    if (!toolName) {
      return NextResponse.json({ success: false, error: '缺少工具名称' }, { status: 400 });
    }

    const record = await prisma.toolUsageHistory.create({
      data: { userId: user.id, toolName },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    logger.error({ err }, 'Add history error');
    return NextResponse.json({ success: false, error: '记录失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    await prisma.toolUsageHistory.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Clear history error');
    return NextResponse.json({ success: false, error: '清空失败' }, { status: 500 });
  }
}
