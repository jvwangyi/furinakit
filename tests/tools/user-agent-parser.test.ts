import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/user-agent-parser';

describe('user-agent-parser', () => {
  it('should parse Chrome on Windows', async () => {
    const result = await tool.execute({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const data = JSON.parse(result.text!);
    expect(data.browser.name).toBe('Chrome');
    expect(data.os.name).toBe('Windows');
    expect(data.device.type).toBe('desktop');
  });

  it('should parse Safari on iPhone', async () => {
    const result = await tool.execute({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const data = JSON.parse(result.text!);
    expect(data.browser.name).toBe('Safari');
    expect(data.os.name).toBe('iOS');
    expect(data.device.type).toBe('mobile');
  });

  it('should parse Firefox on Linux', async () => {
    const result = await tool.execute({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    });
    const data = JSON.parse(result.text!);
    expect(data.browser.name).toBe('Firefox');
    expect(data.os.name).toBe('Linux');
    expect(data.engine.name).toBe('Gecko');
  });
});
