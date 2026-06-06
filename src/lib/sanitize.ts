/**
 * Sanitize user input to prevent XSS and other injection attacks.
 */

/**
 * Sanitize a user's display name.
 * - Strips HTML tags and dangerous characters
 * - Trims whitespace
 * - Limits length to 50 characters
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') return '';
  return name
    .replace(/[<>"'&]/g, '') // Remove HTML-dangerous characters
    .replace(/\s+/g, ' ')    // Collapse whitespace
    .trim()
    .slice(0, 50);
}
