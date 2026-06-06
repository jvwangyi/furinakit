import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/code-minify';

describe('code-minify', () => {
  it('should minify HTML', async () => {
    const result = await tool.execute({
      code: '<div>  \n  Hello  \n  </div>',
      language: 'html',
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toBeDefined();
    expect(data.stats).toBeDefined();
    expect(data.stats.savings).toBeDefined();
  });

  it('should minify CSS', async () => {
    const result = await tool.execute({
      code: 'body { color: red; background: blue; }',
      language: 'css',
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toContain('body{color:red');
  });

  it('should minify JavaScript', async () => {
    const result = await tool.execute({
      code: 'function hello() {\n  return "world";\n}',
      language: 'javascript',
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toContain('function hello()');
    expect(data.result.length).toBeLessThan(40);
  });

  it('should preserve content in pre tags', async () => {
    const result = await tool.execute({
      code: '<pre>  keep  spaces  </pre>',
      language: 'html',
      options: { collapseWhitespace: true },
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toContain('  keep  spaces  ');
  });
});
