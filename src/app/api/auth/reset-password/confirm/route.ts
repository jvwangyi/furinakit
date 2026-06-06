import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { validateEmail, validatePassword } from '@/lib/validation';
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

    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: '请提供完整信息' },
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

    // Validate password strength
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.error },
        { status: 400 }
      );
    }

    // Verify code
    const result = await verifyCode(email, code);
    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error || '验证码错误' },
        { status: 400 }
      );
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, 'Reset password confirm error');
    return NextResponse.json(
      { success: false, error: '重置失败，请稍后重试' },
      { status: 500 }
    );
  }
}
