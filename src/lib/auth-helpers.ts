import { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';
import { prisma } from './prisma';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Extract the current user from the session cookie.
 * Returns null if not authenticated.
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  try {
    const token = request.cookies.get('next-auth.session-token')?.value;
    if (!token) return null;

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    const decoded = await decode({ token, secret });
    if (!decoded?.sub) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, name: true },
    });

    if (!user || !user.email) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}
