import { prisma } from './prisma';
import { getSessionUser } from './auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAdmin(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) {
    return { error: NextResponse.json({ success: false, error: '请先登录' }, { status: 401 }) };
  }

  // Fetch full user to get role
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return { error: NextResponse.json({ success: false, error: '用户不存在' }, { status: 401 }) };
  }

  if (user.role !== 'admin') {
    return { error: NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 }) };
  }

  return { user };
}
