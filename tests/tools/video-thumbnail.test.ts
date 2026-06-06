import { describe, it, expect } from 'vitest';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('video-thumbnail tool', () => {
  const tool = getTool('video-thumbnail');

  it('should be registered', () => {
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('video-thumbnail');
    expect(tool?.category).toBe('video');
  });

  it('should validate input schema with defaults', () => {
    const result = tool!.inputSchema.safeParse({ file: Buffer.from('test') });
    expect(result.success).toBe(true);
  });

  it('should validate input with custom values', () => {
    const result = tool!.inputSchema.safeParse({
      file: Buffer.from('test'),
      timestamp: '00:00:05',
      width: 1280,
      format: 'png',
      quality: 90,
    });
    expect(result.success).toBe(true);
  });

  it('should reject width below minimum', () => {
    const result = tool!.inputSchema.safeParse({
      file: Buffer.from('test'),
      width: 50,
    });
    expect(result.success).toBe(false);
  });

  it('should reject width above maximum', () => {
    const result = tool!.inputSchema.safeParse({
      file: Buffer.from('test'),
      width: 2000,
    });
    expect(result.success).toBe(false);
  });
});
