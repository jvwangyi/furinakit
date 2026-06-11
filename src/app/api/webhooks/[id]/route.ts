/**
 * Webhook API — Delete a specific webhook.
 *
 * DELETE /api/webhooks/[id] — Delete a webhook subscription
 */

import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { deleteWebhook, getWebhook } from '@/lib/webhook';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = getWebhook(id, user.id);
    if (!existing) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 }
      );
    }

    deleteWebhook(id, user.id);

    return Response.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const webhook = getWebhook(id, user.id);
    if (!webhook) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Webhook not found' } },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        hasSecret: !!webhook.secret,
        createdAt: webhook.createdAt,
        lastTriggeredAt: webhook.lastTriggeredAt,
        failureCount: webhook.failureCount,
        active: webhook.active,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
