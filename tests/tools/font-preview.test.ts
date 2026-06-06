import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/font-preview';

describe('font-preview', () => {
  it('should generate CSS with default values', async () => {
    const result = await tool.execute({ text: 'Hello World' });
    const data = JSON.parse(result.text!);
    expect(data.css).toContain('font-family: system-ui');
    expect(data.css).toContain('font-size: 24px');
    expect(data.html).toContain('Hello World');
  });
  it('should apply custom font size', async () => {
    const result = await tool.execute({ text: 'Big text', size: 72 });
    const data = JSON.parse(result.text!);
    expect(data.css).toContain('font-size: 72px');
  });
  it('should support custom colors', async () => {
    const result = await tool.execute({ text: 'Red text', color: '#ff0000', backgroundColor: '#000000' });
    const data = JSON.parse(result.text!);
    expect(data.css).toContain('color: #ff0000');
    expect(data.css).toContain('background-color: #000000');
  });
  it('should HTML-escape special characters', async () => {
    const result = await tool.execute({ text: '<script>alert("xss")</script>' });
    const data = JSON.parse(result.text!);
    expect(data.html).not.toContain('<script>');
    expect(data.html).toContain('&lt;script&gt;');
  });
});
