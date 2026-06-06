import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { validateEmail } from '@/lib/validation';
import { loginLimiter, globalIpLimiter, consumeRateLimit, getClientIp } from '@/lib/rate-limit';
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
    const loginCheck = await consumeRateLimit(loginLimiter, ip, '登录尝试过于频繁，请 15 分钟后重试');
    if (loginCheck) {
      return NextResponse.json(
        { success: false, error: '登录尝试过于频繁，请 15 分钟后重试' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '请提供邮箱和密码' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json(
        { success: false, error: emailCheck.error },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 400 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 400 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, error: '请先验证邮箱', needVerification: true, email: user.email },
        { status: 403 }
      );
    }

    // Generate JWT session token (7 days expiry)
    const sessionToken = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
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
    logger.error({ err }, 'Login error');
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
