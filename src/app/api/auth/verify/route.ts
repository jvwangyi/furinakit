import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { globalIpLimiter, consumeRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const globalCheck = await consumeRateLimit(globalIpLimiter, ip);
    if (globalCheck) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后重试' },
        { status: 429 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: '缺少验证令牌' },
        { status: 400 }
      );
    }

    const result = await verifyToken(token);

    if (!result.valid || !result.email) {
      return NextResponse.json(
        { success: false, error: result.error || '验证失败' },
        { status: 400 }
      );
    }

    // Find user (do not auto-create)
    const user = await prisma.user.findUnique({ where: { email: result.email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 400 }
      );
    }

    // Generate a NextAuth JWT session token (7 days)
    const sessionToken = await encode({
      token: {
        sub: user.id,
        email: result.email,
        name: result.email.split('@')[0],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      secret: process.env.NEXTAUTH_SECRET!,
    });

    // Set httpOnly cookie and return success
    const response = NextResponse.json({ success: true });
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    logger.error({ err }, 'Verify token error');
    return NextResponse.json(
      { success: false, error: '验证失败，请稍后重试' },
      { status: 500 }
    );
  }
}
