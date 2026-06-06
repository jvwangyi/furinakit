import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validateEmail, validatePassword } from '@/lib/validation';
import { registerLimiter, globalIpLimiter, verifyCodeSendLimiter, consumeRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sanitizeName } from '@/lib/sanitize';

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
    const regCheck = await consumeRateLimit(registerLimiter, ip, '注册过于频繁，请 1 小时后重试');
    if (regCheck) {
      return NextResponse.json(
        { success: false, error: '注册过于频繁，请 1 小时后重试' },
        { status: 429 }
      );
    }

    const { email, password, name } = await request.json();

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

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.error },
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

    // Check if user already exists - don't reveal existence
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // If already verified, just return needVerification to not leak info
      // If not verified, resend verification code
      const { sendVerificationCode } = await import('@/lib/auth');
      const codeResult = await sendVerificationCode(email);
      if (!codeResult.success) {
        logger.warn({ email, error: codeResult.error }, 'Failed to send verification code for existing user');
      }
      return NextResponse.json({ success: true, needVerification: true });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Send verification code BEFORE creating user
    const { sendVerificationCode } = await import('@/lib/auth');
    const codeResult = await sendVerificationCode(email);
    if (!codeResult.success) {
      logger.error({ email, error: codeResult.error }, 'Failed to send verification code');
      return NextResponse.json(
        { success: false, error: '验证码发送失败，请稍后重试' },
        { status: 500 }
      );
    }

    // Create user (email not verified yet)
    const sanitizedName = sanitizeName(name) || email.split('@')[0];
    await prisma.user.create({
      data: {
        email,
        name: sanitizedName,
        password: hashedPassword,
        emailVerified: null, // Require email verification
      },
    });

    return NextResponse.json({ success: true, needVerification: true });
  } catch (err: any) {
    logger.error({ err, email: request.body ? 'present' : 'absent' }, 'Register error');
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
