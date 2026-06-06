import { describe, it, expect } from 'vitest';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('gif-maker tool', () => {
  const tool = getTool('gif-maker');

  it('should be registered', () => {
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('gif-maker');
    expect(tool?.category).toBe('image');
  });

  it('should validate images-to-gif input', () => {
    const result = tool!.inputSchema.safeParse({
      mode: 'images-to-gif',
      files: [Buffer.from('test1'), Buffer.from('test2')],
      fps: 10,
      width: 320,
    });
    expect(result.success).toBe(true);
  });

  it('should validate video-to-gif input', () => {
    const result = tool!.inputSchema.safeParse({
      mode: 'video-to-gif',
      files: [Buffer.from('test')],
      fps: 15,
      width: 480,
      duration: 3,
    });
    expect(result.success).toBe(true);
  });

  it('should require at least one file', () => {
    const result = tool!.inputSchema.safeParse({
      mode: 'images-to-gif',
      files: [],
    });
    expect(result.success).toBe(false);
  });

  it('should apply default values', () => {
    const result = tool!.inputSchema.safeParse({
      mode: 'images-to-gif',
      files: [Buffer.from('test')],
    });
    expect(result.success).toBe(true);
  });
});
