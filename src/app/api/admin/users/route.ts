import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users — List all users with stats
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(request.nextUrl.searchParams.get('pageSize') || '20', 10), 100);
  const search = request.nextUrl.searchParams.get('search') || '';

  const where = search
    ? {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            history: true,
            favorites: true,
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  });
}

/**
 * PATCH /api/admin/users — Update user role
 * Body: { userId: string, role: string }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  let body: { userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { userId, role } = body;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'userId is required' } },
      { status: 400 }
    );
  }

  // Prevent admin from demoting themselves
  if (userId === auth.user.id && role && role !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '不能修改自己的管理员角色' } },
      { status: 400 }
    );
  }

  const validRoles = ['user', 'admin'];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: `role must be one of: ${validRoles.join(', ')}` } },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(role ? { role } : {}) },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } },
      { status: 404 }
    );
  }
}

/**
 * DELETE /api/admin/users — Delete a user
 * Body: { userId: string }
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { userId } = body;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'userId is required' } },
      { status: 400 }
    );
  }

  // Prevent admin from deleting themselves
  if (userId === auth.user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '不能删除自己' } },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } },
      { status: 404 }
    );
  }
}
