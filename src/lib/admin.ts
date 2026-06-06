import { getSessionUser } from './auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAdmin(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return { error: NextResponse.json({ success: false, error: '请先登录' }, { status: 401 }) };
  if ((user as any).role !== 'admin') return { error: NextResponse.json({ success: false, error: '需要管理员权限' }, { status: 403 }) };
  return { user };
}
