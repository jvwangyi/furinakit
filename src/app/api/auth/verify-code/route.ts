import { NextRequest, NextResponse } from 'next/server';
import { verifyCode } from '@/lib/auth';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/lib/validation';
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

    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: '请提供邮箱和验证码' },
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

    const result = await verifyCode(email, code);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error || '验证失败' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: '验证失败' },
        { status: 400 }
      );
    }

    // Generate JWT session token (7 days expiry)
    const sessionToken = await encode({
      token: {
        sub: user.id,
        email: email,
        name: email.split('@')[0],
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
    logger.error({ err }, 'Verify code error');
    return NextResponse.json(
      { success: false, error: '验证失败，请稍后重试' },
      { status: 500 }
    );
  }
}
