import { z } from 'zod';
import { createHash } from 'crypto';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string().optional(),
  file: z.instanceof(Buffer).optional(),
  algorithm: z.enum(['md5', 'sha1', 'sha256', 'sha384', 'sha512']).default('sha256'),
});

const tool: Tool = {
  name: 'hash',
  description: 'Generate hash of text or file (MD5, SHA1, SHA256, SHA384, SHA512)',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, file, algorithm } = inputSchema.parse(input);

    const data = file || Buffer.from(text || '', 'utf-8');

    const hashHex = createHash(algorithm).update(data).digest('hex');

    return {
      text: hashHex,
      data: JSON.stringify({
        algorithm,
        hash: hashHex,
        length: hashHex.length,
      }),
    };
  },
};

register(tool);
export default tool;
