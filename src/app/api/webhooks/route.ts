/**
 * Webhook API — Register and list webhook subscriptions.
 *
 * POST /api/webhooks — Register a new webhook
 * GET  /api/webhooks  — List current user's webhooks
 */

import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { registerWebhook, listWebhooks, getDeliveryLog } from '@/lib/webhook';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';

// ── POST — Register webhook ─────────────────────────────────────────────────

interface RegisterBody {
  /** Webhook callback URL (http/https) */
  url: string;
  /** Event types to subscribe to */
  events: string[];
  /** Optional HMAC secret for signature verification */
  secret?: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } },
        { status: 401 }
      );
    }

    const body = (await req.json()) as RegisterBody;

    if (!body.url || typeof body.url !== 'string') {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'url is required and must be a string');
    }

    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'events array is required and must not be empty');
    }

    const sub = registerWebhook({
      userId: user.id,
      url: body.url,
      events: body.events as any[],
      secret: body.secret,
    });

    return Response.json({
      success: true,
      data: {
        id: sub.id,
        url: sub.url,
        events: sub.events,
        hasSecret: !!sub.secret,
        createdAt: sub.createdAt,
        active: sub.active,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ── GET — List webhooks ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const includeLog = searchParams.get('log') === 'true';

    const webhooks = listWebhooks(user.id);

    const result: Record<string, unknown> = {
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        hasSecret: !!w.secret,
        createdAt: w.createdAt,
        lastTriggeredAt: w.lastTriggeredAt,
        failureCount: w.failureCount,
        active: w.active,
      })),
    };

    if (includeLog) {
      result.recentDeliveries = getDeliveryLog(user.id, 50);
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
