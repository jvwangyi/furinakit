import { describe, it, expect } from 'vitest';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('image-compare tool', () => {
  const tool = getTool('image-compare');

  it('should be registered', () => {
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('image-compare');
    expect(tool?.category).toBe('image');
  });

  it('should validate input schema with defaults', () => {
    const result = tool!.inputSchema.safeParse({
      before: Buffer.from('test'),
      after: Buffer.from('test'),
    });
    expect(result.success).toBe(true);
  });

  it('should accept all three modes', () => {
    for (const mode of ['side-by-side', 'overlay', 'diff']) {
      const result = tool!.inputSchema.safeParse({
        before: Buffer.from('test'),
        after: Buffer.from('test'),
        mode,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid mode', () => {
    const result = tool!.inputSchema.safeParse({
      before: Buffer.from('test'),
      after: Buffer.from('test'),
      mode: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});
