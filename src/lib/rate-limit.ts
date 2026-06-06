import { validateApiKey } from './api-key';
import { RateLimiterMemory } from 'rate-limiter-flexible';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (request: Request) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyGenerator = defaultKeyGenerator } = options;

  return {
    check: (
      request: Request
    ): { allowed: boolean; remaining: number; resetTime: number } => {
      const key = keyGenerator(request);
      const now = Date.now();
      let entry = store.get(key);

      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + windowMs };
        store.set(key, entry);
      }

      entry.count++;
      const remaining = Math.max(0, max - entry.count);

      return {
        allowed: entry.count <= max,
        remaining,
        resetTime: entry.resetTime,
      };
    },
  };
}

function defaultKeyGenerator(request: Request): string {
  // Use X-Forwarded-For if behind proxy, else use a fallback
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Fallback: use a generic key for serverless
  return 'global';
}

/**
 * Extract API key from Authorization header.
 * Format: "Bearer fk_..."
 */
export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer fk_')) {
    return authHeader.slice(7); // Remove "Bearer " prefix
  }
  return null;
}

/** Default rate limiter: 60 requests per minute per IP */
export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});

/** API key rate limiter: 300 requests per minute per API key */
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: (request: Request) => {
    const key = extractApiKey(request);
    return key ? `apikey:${key}` : 'unknown';
  },
});

/**
 * Check rate limit with API key awareness.
 * - Valid API key: 300 requests/minute
 * - No API key: 60 requests/minute (default)
 */
export function checkRateLimit(
  request: Request
): { allowed: boolean; remaining: number; resetTime: number; isApiKey: boolean } {
  const apiKey = extractApiKey(request);

  if (apiKey) {
    const validKey = validateApiKey(apiKey);
    if (validKey) {
      const result = apiKeyLimiter.check(request);
      return { ...result, isApiKey: true };
    }
    // Invalid API key — fall through to default rate limit
  }

  const result = defaultLimiter.check(request);
  return { ...result, isApiKey: false };
}

// ============================================================
// Auth-specific rate limiters using rate-limiter-flexible
// ============================================================

/** Global IP rate limiter: 100 requests per minute */
export const globalIpLimiter = new RateLimiterMemory({
  keyPrefix: 'global_ip',
  points: 100,
  duration: 60,
});

/** Verification code send limiter: 3 per 10 minutes per email */
export const verifyCodeSendLimiter = new RateLimiterMemory({
  keyPrefix: 'verify_send',
  points: 3,
  duration: 600,
});

/** Login attempt limiter: 10 per 15 minutes per IP */
export const loginLimiter = new RateLimiterMemory({
  keyPrefix: 'login',
  points: 10,
  duration: 900,
});

/** Registration limiter: 5 per hour per IP */
export const registerLimiter = new RateLimiterMemory({
  keyPrefix: 'register',
  points: 5,
  duration: 3600,
});

/**
 * Helper to get client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

/**
 * Helper to consume a rate limiter point.
 * Returns null if allowed, or a NextResponse with 429 if blocked.
 */
export async function consumeRateLimit(
  limiter: RateLimiterMemory,
  key: string,
  errorMessage: string = '请求过于频繁，请稍后重试'
): Promise<null | { blocked: true; retryAfter: number }> {
  try {
    await limiter.consume(key);
    return null;
  } catch (rateLimiterRes: any) {
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 60;
    return { blocked: true, retryAfter };
  }
}
