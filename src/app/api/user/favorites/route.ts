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

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: favorites });
  } catch (err) {
    logger.error({ err }, 'Get favorites error');
    return NextResponse.json({ success: false, error: '获取收藏失败' }, { status: 500 });
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

    const favorite = await prisma.favorite.upsert({
      where: { userId_toolName: { userId: user.id, toolName } },
      update: {},
      create: { userId: user.id, toolName },
    });

    return NextResponse.json({ success: true, data: favorite });
  } catch (err) {
    logger.error({ err }, 'Add favorite error');
    return NextResponse.json({ success: false, error: '收藏失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const toolName = searchParams.get('tool');

    if (toolName) {
      await prisma.favorite.deleteMany({
        where: { userId: user.id, toolName },
      });
    } else {
      await prisma.favorite.deleteMany({ where: { userId: user.id } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Remove favorite error');
    return NextResponse.json({ success: false, error: '取消收藏失败' }, { status: 500 });
  }
}
