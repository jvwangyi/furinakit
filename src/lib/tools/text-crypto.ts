import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const inputSchema = z.object({
  text: z.string().min(1),
  algorithm: z.enum(['aes-256-cbc', 'aes-128-cbc', 'des-cbc', 'base64-encode', 'base64-decode', 'rot13']),
  key: z.string().optional(),
  mode: z.enum(['encrypt', 'decrypt']).default('encrypt'),
});

// AES key sizes (bytes): aes-256-cbc = 32, aes-128-cbc = 16, des-cbc = 8
function getKeySize(algorithm: string): number {
  if (algorithm.startsWith('aes-256')) return 32;
  if (algorithm.startsWith('aes-128')) return 16;
  if (algorithm.startsWith('des')) return 8;
  return 0;
}

// Simple ROT13
function rot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

const tool: Tool = {
  name: 'text-crypto',
  description: 'Encrypt and decrypt text using various algorithms',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, algorithm, key, mode } = inputSchema.parse(input);

    try {
      // Base64 encoding
      if (algorithm === 'base64-encode') {
        const result = Buffer.from(text, 'utf-8').toString('base64');
        return { text: JSON.stringify({ algorithm, mode: 'encrypt', result }, null, 2) };
      }
      if (algorithm === 'base64-decode') {
        const result = Buffer.from(text, 'base64').toString('utf-8');
        return { text: JSON.stringify({ algorithm, mode: 'decrypt', result }, null, 2) };
      }

      // ROT13
      if (algorithm === 'rot13') {
        const result = rot13(text);
        return { text: JSON.stringify({ algorithm, mode, result }, null, 2) };
      }

      // AES / DES encryption
      const keySize = getKeySize(algorithm);
      if (mode === 'encrypt') {
        const encKey = key || randomBytes(keySize).toString('hex').slice(0, keySize);
        const keyBuffer = Buffer.from(encKey.padEnd(keySize, '\0').slice(0, keySize));
        const iv = randomBytes(16).slice(0, keySize === 8 ? 8 : 16);
        const cipher = createCipheriv(algorithm, keyBuffer, iv);
        let encrypted = cipher.update(text, 'utf-8', 'hex');
        encrypted += cipher.final('hex');
        return {
          text: JSON.stringify({
            algorithm,
            mode: 'encrypt',
            result: encrypted,
            iv: iv.toString('hex'),
            key: encKey,
          }, null, 2),
        };
      } else {
        // decrypt
        if (!key) {
          return { text: JSON.stringify({ error: 'Decryption requires a key' }) };
        }
        const keyBuffer = Buffer.from(key.padEnd(keySize, '\0').slice(0, keySize));
        const iv = randomBytes(16).slice(0, keySize === 8 ? 8 : 16);
        const decipher = createDecipheriv(algorithm, keyBuffer, iv);
        let decrypted = decipher.update(text, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');
        return {
          text: JSON.stringify({
            algorithm,
            mode: 'decrypt',
            result: decrypted,
          }, null, 2),
        };
      }
    } catch (err: any) {
      return { text: JSON.stringify({ error: err.message || 'Crypto operation failed' }) };
    }
  },
};

register(tool);
export default tool;
