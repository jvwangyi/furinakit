import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/markdown-live';

describe('markdown-live', () => {
  it('should convert markdown to HTML', async () => {
    const result = await tool.execute({
      markdown: '# Hello World\n\nThis is **bold** text.',
    });
    const data = JSON.parse(result.text!);
    expect(data.html).toContain('<h1');
    expect(data.html).toContain('<strong>bold</strong>');
  });

  it('should handle code blocks', async () => {
    const result = await tool.execute({
      markdown: '```javascript\nconsole.log("hello");\n```',
    });
    const data = JSON.parse(result.text!);
    expect(data.html).toContain('<code');
  });

  it('should calculate stats', async () => {
    const result = await tool.execute({
      markdown: 'Line 1\nLine 2\nLine 3',
    });
    const data = JSON.parse(result.text!);
    expect(data.lineCount).toBe(3);
    expect(data.wordCount).toBe(6);
  });

  it('should handle links and images', async () => {
    const result = await tool.execute({
      markdown: '[Google](https://google.com)\n\n![Alt](https://example.com/img.png)',
    });
    const data = JSON.parse(result.text!);
    expect(data.html).toContain('href="https://google.com"');
    expect(data.html).toContain('src="https://example.com/img.png"');
  });

  it('should handle empty markdown gracefully', async () => {
    const result = await tool.execute({
      markdown: '',
    });
    // Should return error since min(1) validation
    expect(result.text).toBeDefined();
  });
});
