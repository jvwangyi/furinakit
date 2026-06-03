/**
 * Centralized basePath configuration.
 * Server-side: mirrors next.config.ts logic (empty in CI, '/furinakit' in production).
 * Client-side: reads from NEXT_PUBLIC_BASE_PATH env var set at build time.
 */
export const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.CI === 'true' ? '' : '/furinakit');

/** Prepend basePath to a path (e.g. '/furina.jpg' → '/furinakit/furina.jpg') */
export function withBasePath(path: string): string {
  return `${basePath}${path}`;
}
