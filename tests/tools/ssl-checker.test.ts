import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/ssl-checker';

describe('ssl-checker', () => {
  it('should have correct metadata', () => {
    expect(tool.name).toBe('ssl-checker');
    expect(tool.category).toBe('dev');
  });
  it('should validate schema with defaults', () => {
    const result = tool.inputSchema.safeParse({ hostname: 'example.com' });
    expect(result.success).toBe(true);
    expect((result.data as any)?.port).toBe(443);
  });
  it('should accept custom port', () => {
    const result = tool.inputSchema.safeParse({ hostname: 'example.com', port: 8443 });
    expect(result.success).toBe(true);
  });
});
