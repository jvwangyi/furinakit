import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/text-crypto';

describe('text-crypto', () => {
  it('should Base64 encode', async () => {
    const result = await tool.execute({
      text: 'Hello World',
      algorithm: 'base64-encode',
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toBe('SGVsbG8gV29ybGQ=');
  });

  it('should Base64 decode', async () => {
    const result = await tool.execute({
      text: 'SGVsbG8gV29ybGQ=',
      algorithm: 'base64-decode',
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toBe('Hello World');
  });

  it('should ROT13 encode', async () => {
    const result = await tool.execute({
      text: 'Hello World',
      algorithm: 'rot13',
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toBe('Uryyb Jbeyq');
  });

  it('should AES encrypt and return key+iv', async () => {
    const result = await tool.execute({
      text: 'secret message',
      algorithm: 'aes-256-cbc',
      mode: 'encrypt',
    });
    const data = JSON.parse(result.text!);
    expect(data.result).toBeDefined();
    expect(data.key).toBeDefined();
    expect(data.iv).toBeDefined();
  });

  it('should require key for decryption', async () => {
    const result = await tool.execute({
      text: 'encrypted_text',
      algorithm: 'aes-256-cbc',
      mode: 'decrypt',
    });
    const data = JSON.parse(result.text!);
    expect(data.error).toContain('Decryption requires a key');
  });
});
