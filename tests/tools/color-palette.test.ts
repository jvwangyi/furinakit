import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/color-palette';

describe('color-palette', () => {
  it('should generate complementary palette', async () => {
    const result = await tool.execute({
      color: '#3498db',
      scheme: 'complementary',
      count: 5,
    });
    const data = JSON.parse(result.text!);
    expect(data.palette).toHaveLength(5);
    expect(data.palette[0].hex).toBe('#3498db');
    expect(data.css).toContain('--color-1');
  });

  it('should generate analogous palette', async () => {
    const result = await tool.execute({
      color: '#e74c3c',
      scheme: 'analogous',
      count: 3,
    });
    const data = JSON.parse(result.text!);
    expect(data.palette).toHaveLength(3);
  });

  it('should include WCAG contrast info', async () => {
    const result = await tool.execute({
      color: '#000000',
      scheme: 'monochromatic',
      count: 2,
    });
    const data = JSON.parse(result.text!);
    expect(data.palette[0].contrastWhite).toBeDefined();
    expect(data.palette[0].wcagAA).toBeDefined();
  });
});
