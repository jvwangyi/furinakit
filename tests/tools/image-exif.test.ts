import { describe, it, expect } from 'vitest';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('image-exif tool', () => {
  const tool = getTool('image-exif');

  it('should be registered', () => {
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('image-exif');
    expect(tool?.category).toBe('image');
  });

  it('should return no EXIF error for invalid image', async () => {
    // 1x1 transparent PNG (no EXIF)
    const result = await tool!.execute({
      file: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      section: 'basic',
    });
    const data = JSON.parse(result.text!);
    expect(data.error).toContain('No EXIF data');
  });

  it('should accept section parameter', async () => {
    const result = await tool!.execute({
      file: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      section: 'camera',
    });
    // Should not crash
    expect(result.text).toBeDefined();
  });

  it('should accept all section values', async () => {
    const sections = ['all', 'basic', 'camera', 'gps', 'thumbnail'] as const;
    for (const section of sections) {
      const result = await tool!.execute({
        file: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        section,
      });
      expect(result.text).toBeDefined();
      const data = JSON.parse(result.text!);
      // Should either have EXIF data or an error message
      expect(data).toBeDefined();
    }
  });
});
