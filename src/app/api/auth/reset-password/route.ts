import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode } from '@/lib/auth';
import { validateEmail } from '@/lib/validation';
import { verifyCodeSendLimiter, globalIpLimiter, consumeRateLimit, getClientIp } from '@/lib/rate-limit';
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: '请提供邮箱' },
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

    // Rate limit per email for code sending
    const emailCheck2 = await consumeRateLimit(verifyCodeSendLimiter, `email:${email}`);
    if (emailCheck2) {
      return NextResponse.json(
        { success: false, error: '验证码发送过于频繁，请稍后重试' },
        { status: 429 }
      );
    }

    // Check if user exists - don't reveal
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true });
    }

    // Send verification code
    const result = await sendVerificationCode(email);
    if (!result.success) {
      logger.error({ error: result.error }, 'Failed to send reset code');
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, 'Reset password error');
    return NextResponse.json(
      { success: false, error: '发送失败，请稍后重试' },
      { status: 500 }
    );
  }
}
