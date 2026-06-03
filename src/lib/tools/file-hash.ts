import { z } from 'zod';
import { createHash } from 'crypto';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  file: z.string(), // Base64 encoded file
  algorithm: z.enum(['md5', 'sha1', 'sha256', 'sha512']).default('sha256'),
  filename: z.string().optional(),
});

const tool: Tool = {
  name: 'file-hash',
  description: 'Calculate file hash using various algorithms (MD5, SHA1, SHA256, SHA512)',
  category: 'file',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, algorithm, filename } = inputSchema.parse(input);

    try {
      const buffer = Buffer.from(file, 'base64');
      const hash = createHash(algorithm).update(buffer).digest('hex');

      return {
        text: JSON.stringify({
          filename: filename || 'unknown',
          algorithm,
          hash,
          size: buffer.length,
        }, null, 2),
      };
    } catch (e) {
      throw new Error(`Failed to calculate hash: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
