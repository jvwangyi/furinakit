import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

/**
 * Send a 6-digit verification code to the user's email
 */
export async function sendVerificationCode(email: string): Promise<{ success: boolean; error?: string }> {
  // Generate 6-digit code using cryptographically secure random
  const code = crypto.randomInt(100000, 1000000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store in VerificationToken table (use code as token, email as identifier)
  // Delete any existing codes for this email first
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: code,
      expires,
    },
  });

  // Send email with code
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'FurinaKit <onboarding@resend.dev>',
        to: email,
        subject: 'FurinaKit 验证码',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h1 style="color: #333; font-size: 24px;">🎭 FurinaKit</h1>
            <p style="color: #666; font-size: 16px;">你的登录验证码：</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366f1; text-align: center; padding: 24px; background: #f8f9fa; border-radius: 8px; margin: 16px 0;">
              ${code}
            </div>
            <p style="color: #999; font-size: 14px;">10 分钟内有效。如果不是你操作的，请忽略此邮件。</p>
          </div>
        `,
      });
      return { success: true };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email:', err);
      return { success: false, error: '邮件发送失败，请稍后重试' };
    }
  }

  // Fallback: log to console (dev only)
  // eslint-disable-next-line no-console
  console.log(`\n🔑 验证码 for ${email}: ${code}\n`);
  return { success: true };
}

/**
 * Send a magic link email to the user (deprecated, kept for backward compatibility)
 */
export async function sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  return sendVerificationCode(email);
}

/**
 * Verify a 6-digit code with brute-force protection
 * Max 5 failed attempts per 10 minutes per email
 */
const VERIFY_ATTEMPTS_KEY = 'verify_attempts:';
const verifyAttemptStore = new Map<string, { count: number; resetTime: number }>();

function checkVerifyAttempts(email: string): { allowed: boolean; error?: string } {
  const key = VERIFY_ATTEMPTS_KEY + email;
  const now = Date.now();
  let entry = verifyAttemptStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + 10 * 60 * 1000 };
    verifyAttemptStore.set(key, entry);
  }

  if (entry.count >= 5) {
    return { allowed: false, error: '验证失败次数过多，请 10 分钟后重试' };
  }

  return { allowed: true };
}

function recordVerifyAttempt(email: string): void {
  const key = VERIFY_ATTEMPTS_KEY + email;
  const now = Date.now();
  let entry = verifyAttemptStore.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + 10 * 60 * 1000 };
    verifyAttemptStore.set(key, entry);
  }
  entry.count++;
}

function clearVerifyAttempts(email: string): void {
  verifyAttemptStore.delete(VERIFY_ATTEMPTS_KEY + email);
}

export async function verifyCode(email: string, code: string): Promise<{ valid: boolean; error?: string }> {
  // Check brute-force protection
  const attemptCheck = checkVerifyAttempts(email);
  if (!attemptCheck.allowed) {
    return { valid: false, error: attemptCheck.error };
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: code,
    },
  });

  if (!record) {
    recordVerifyAttempt(email);
    return { valid: false, error: '验证码错误' };
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: code } });
    recordVerifyAttempt(email);
    return { valid: false, error: '验证码已过期，请重新获取' };
  }

  // Delete the used code
  await prisma.verificationToken.delete({ where: { token: code } });

  // Clean up expired codes for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email,
      expires: { lt: new Date() },
    },
  });

  // Clear attempts on success
  clearVerifyAttempts(email);

  // Upsert user
  await prisma.user.upsert({
    where: { email },
    create: { email, emailVerified: new Date() },
    update: { emailVerified: new Date() },
  });

  return { valid: true };
}

/**
 * Verify a magic link token and create/update user
 */
export async function verifyToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return { valid: false, error: '无效或已过期的链接' };
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { valid: false, error: '链接已过期，请重新登录' };
  }

  const email = record.identifier;

  // Delete the used token
  await prisma.verificationToken.delete({ where: { token } });

  // Clean up expired tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email,
      expires: { lt: new Date() },
    },
  });

  // Upsert user
  await prisma.user.upsert({
    where: { email },
    create: { email, emailVerified: new Date() },
    update: { emailVerified: new Date() },
  });

  return { valid: true, email };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // GitHub OAuth
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'magic-link',
      name: 'Magic Link',
      credentials: {},
      async authorize() {
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user, account }) {
      // OAuth providers auto-verify email
      if (account?.provider === 'github' && user.email) {
        await prisma.user.updateMany({
          where: { email: user.email, emailVerified: null },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
  },
  pages: {
    signIn: '/furinakit/auth/signin',
  },
};
