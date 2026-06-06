import { NextRequest, NextResponse } from 'next/server';
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

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: '请提供邮箱地址' },
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
    const emailRateCheck = await consumeRateLimit(verifyCodeSendLimiter, `email:${email}`);
    if (emailRateCheck) {
      return NextResponse.json(
        { success: false, error: '验证码发送过于频繁，请稍后重试' },
        { status: 429 }
      );
    }

    const result = await sendVerificationCode(email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '发送失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, 'Magic link error');
    return NextResponse.json(
      { success: false, error: '发送失败，请稍后重试' },
      { status: 500 }
    );
  }
}
