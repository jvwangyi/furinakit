import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/dns-lookup';

describe('dns-lookup', () => {
  it('should have correct metadata', () => {
    expect(tool.name).toBe('dns-lookup');
    expect(tool.category).toBe('dev');
  });
  it('should validate schema with default recordType', () => {
    const result = tool.inputSchema.safeParse({ domain: 'example.com' });
    expect(result.success).toBe(true);
    expect((result.data as any)?.recordType).toBe('ALL');
  });
  it('should accept specific record types', () => {
    for (const type of ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA']) {
      const result = tool.inputSchema.safeParse({ domain: 'example.com', recordType: type });
      expect(result.success).toBe(true);
    }
  });
});
