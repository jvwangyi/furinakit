import { NextResponse } from 'next/server';

// Simple GitHub OAuth redirect — bypasses next-auth/react signIn issues
export async function GET() {
  const clientId = process.env.GITHUB_ID;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://8.130.38.139:9003/furinakit/api/auth';
  const callbackUrl = `${baseUrl}/callback/github`;

  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=read:user+user:email`;

  return NextResponse.redirect(githubAuthUrl);
}
