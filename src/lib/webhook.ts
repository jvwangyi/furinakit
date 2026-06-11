/**
 * Webhook callback system for async task notifications.
 *
 * Manages webhook subscriptions (register/list/delete) and dispatches
 * signed HTTP POST callbacks when tasks or batches complete/fail.
 *
 * No external dependencies — uses Node.js native fetch + crypto.
 */

import { logger } from './logger';

// ── Types ───────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'task.completed'
  | 'task.failed'
  | 'batch.completed'
  | 'batch.failed';

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string | null;
  createdAt: number;
  lastTriggeredAt: number | null;
  failureCount: number;
  /** Auto-disabled after 20 consecutive failures */
  active: boolean;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  webhookId: string;
  event: WebhookEvent;
  success: boolean;
  statusCode: number | null;
  error: string | null;
  attempts: number;
  deliveredAt: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000]; // exponential backoff
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_FAILURES_BEFORE_DISABLE = 20;

// Allowed protocols — prevents SSRF via file://, gopher://, etc.
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// ── Storage ─────────────────────────────────────────────────────────────────

const subscriptions = new Map<string, WebhookSubscription>();

/** Recent delivery log (ring buffer, last 200) */
const deliveryLog: WebhookDeliveryResult[] = [];
const MAX_LOG_SIZE = 200;

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate HMAC-SHA256 signature for a webhook payload.
 */
export function signPayload(payload: string, secret: string): string {
  const { createHmac } = require('crypto');
  return createHmac('sha256', secret).update(payload).digest('hex');
}

// ── Subscription Management ─────────────────────────────────────────────────

export interface RegisterWebhookInput {
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

/**
 * Register a new webhook subscription.
 */
export function registerWebhook(input: RegisterWebhookInput): WebhookSubscription {
  if (!isValidUrl(input.url)) {
    throw new Error('Invalid webhook URL. Must be http:// or https://');
  }

  if (!input.events || input.events.length === 0) {
    throw new Error('At least one event type is required');
  }

  const validEvents: WebhookEvent[] = [
    'task.completed',
    'task.failed',
    'batch.completed',
    'batch.failed',
  ];

  for (const event of input.events) {
    if (!validEvents.includes(event)) {
      throw new Error(`Invalid event type: ${event}. Valid: ${validEvents.join(', ')}`);
    }
  }

  const sub: WebhookSubscription = {
    id: generateId('wh'),
    userId: input.userId,
    url: input.url,
    events: [...input.events],
    secret: input.secret || null,
    createdAt: Date.now(),
    lastTriggeredAt: null,
    failureCount: 0,
    active: true,
  };

  subscriptions.set(sub.id, sub);

  logger.info({ webhookId: sub.id, userId: sub.userId, url: sub.url, events: sub.events }, 'Webhook registered');

  return sub;
}

/**
 * List all webhooks for a user.
 */
export function listWebhooks(userId: string): WebhookSubscription[] {
  const results: WebhookSubscription[] = [];
  for (const sub of subscriptions.values()) {
    if (sub.userId === userId) {
      results.push(sub);
    }
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get a single webhook by ID (only if owned by the given user).
 */
export function getWebhook(id: string, userId: string): WebhookSubscription | null {
  const sub = subscriptions.get(id);
  if (!sub || sub.userId !== userId) return null;
  return sub;
}

/**
 * Delete a webhook subscription.
 */
export function deleteWebhook(id: string, userId: string): boolean {
  const sub = subscriptions.get(id);
  if (!sub || sub.userId !== userId) return false;
  subscriptions.delete(id);
  logger.info({ webhookId: id, userId }, 'Webhook deleted');
  return true;
}

/**
 * Get recent delivery log for a user's webhooks.
 */
export function getDeliveryLog(userId: string, limit = 50): WebhookDeliveryResult[] {
  const userWebhookIds = new Set<string>();
  for (const sub of subscriptions.values()) {
    if (sub.userId === userId) {
      userWebhookIds.add(sub.id);
    }
  }

  return deliveryLog
    .filter((d) => userWebhookIds.has(d.webhookId))
    .slice(-limit)
    .reverse();
}

// ── Dispatch ────────────────────────────────────────────────────────────────

/**
 * Dispatch a webhook event to all matching subscriptions.
 * This is fire-and-forget — it never throws and never blocks the caller.
 */
export function dispatchWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>
): void {
  // Run async in background — don't await, don't block
  dispatchWebhookAsync(event, data).catch((err) => {
    logger.error({ err, event }, 'Unexpected error in webhook dispatch');
  });
}

async function dispatchWebhookAsync(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Find all active subscriptions matching this event
  const targets: WebhookSubscription[] = [];
  for (const sub of subscriptions.values()) {
    if (sub.active && sub.events.includes(event)) {
      targets.push(sub);
    }
  }

  if (targets.length === 0) return;

  // Dispatch to all targets concurrently
  const promises = targets.map((sub) => deliverWebhook(sub, payload));
  await Promise.allSettled(promises);
}

/**
 * Deliver a webhook payload to a single subscription with retry logic.
 */
async function deliverWebhook(
  sub: WebhookSubscription,
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = sub.secret ? signPayload(body, sub.secret) : null;

  let lastError: string | null = null;
  let lastStatusCode: number | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'FurinaKit-Webhook/1.0',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
      };

      if (signature) {
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(sub.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
        // Prevent following redirects to internal IPs
        redirect: 'error',
      });

      clearTimeout(timeout);

      lastStatusCode = response.status;

      // 2xx = success
      if (response.ok) {
        // Reset failure count on success
        sub.failureCount = 0;
        sub.lastTriggeredAt = Date.now();

        logDelivery({
          webhookId: sub.id,
          event: payload.event,
          success: true,
          statusCode: response.status,
          error: null,
          attempts: attempt + 1,
          deliveredAt: Date.now(),
        });
        return;
      }

      lastError = `HTTP ${response.status}`;
      // Don't retry on 4xx (client error) — only on 5xx
      if (response.status >= 400 && response.status < 500) {
        break;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      lastStatusCode = null;

      // Don't retry on abort (non-retryable) for certain errors
      if (err?.name === 'AbortError') {
        lastError = 'Request timed out';
      }
    }

    // Wait before retry (skip on last attempt)
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  // All retries exhausted
  sub.failureCount++;
  sub.lastTriggeredAt = Date.now();

  if (sub.failureCount >= MAX_FAILURES_BEFORE_DISABLE) {
    sub.active = false;
    logger.warn(
      { webhookId: sub.id, failureCount: sub.failureCount },
      'Webhook auto-disabled after too many failures'
    );
  }

  logDelivery({
    webhookId: sub.id,
    event: payload.event,
    success: false,
    statusCode: lastStatusCode,
    error: lastError,
    attempts: MAX_RETRIES + 1,
    deliveredAt: Date.now(),
  });

  logger.warn(
    { webhookId: sub.id, event: payload.event, error: lastError },
    'Webhook delivery failed after retries'
  );
}

function logDelivery(result: WebhookDeliveryResult): void {
  deliveryLog.push(result);
  // Trim to max size
  while (deliveryLog.length > MAX_LOG_SIZE) {
    deliveryLog.shift();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Cleanup ─────────────────────────────────────────────────────────────────

if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    // Remove disabled webhooks older than 7 days
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const [id, sub] of subscriptions.entries()) {
      if (!sub.active && sub.lastTriggeredAt && sub.lastTriggeredAt < cutoff) {
        subscriptions.delete(id);
      }
    }
  }, 60 * 60 * 1000); // Check every hour
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}
