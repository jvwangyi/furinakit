import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/api-key';
import { getSessionUser } from '@/lib/auth-helpers';
import { globalIpLimiter, consumeRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// List all API keys
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
  }
  const keys = listApiKeys();
  return NextResponse.json({ success: true, data: keys });
}

// Create a new API key
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const rateCheck = await consumeRateLimit(globalIpLimiter, ip);
  if (rateCheck) {
    return NextResponse.json({ success: false, error: '请求过于频繁' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const name = body.name || 'Unnamed Key';
    const { key, apiKey } = generateApiKey(name);

    logger.info({ userId: user.id, keyId: apiKey.id }, 'API key created');
    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Create API key error');
    return NextResponse.json({ success: false, error: '创建失败' }, { status: 500 });
  }
}

// Revoke an API key
export async function DELETE(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_ID', message: 'API key ID required' } },
        { status: 400 }
      );
    }

    const revoked = revokeApiKey(id);
    if (!revoked) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'API key not found' } },
        { status: 404 }
      );
    }

    logger.info({ userId: user.id, keyId: id }, 'API key revoked');
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Revoke API key error');
    return NextResponse.json({ success: false, error: '撤销失败' }, { status: 500 });
  }
}
