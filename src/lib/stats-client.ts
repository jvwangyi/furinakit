import { apiPath } from '@/lib/utils';

/**
 * Record tool usage on the server (fire-and-forget).
 * Does not block or throw on failure.
 */
export function recordServerStats(toolName: string) {
  fetch(apiPath('/api/stats'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolName }),
  }).catch(() => {
    // Silently ignore failures
  });
}
