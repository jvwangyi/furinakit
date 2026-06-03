import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string().optional(),
  file: z.instanceof(Buffer).optional(),
  action: z.enum(['encode', 'decode']),
  encoding: z.enum(['base64', 'base64url']).default('base64'),
});

const tool: Tool = {
  name: 'base64',
  description: 'Encode or decode Base64 strings and files',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, file, action, encoding } = inputSchema.parse(input);
    
    if (action === 'encode') {
      if (file) {
        const encoded = file.toString(encoding === 'base64url' ? 'base64url' : 'base64');
        return { text: encoded };
      }
      if (text) {
        const encoded = Buffer.from(text, 'utf-8').toString(encoding === 'base64url' ? 'base64url' : 'base64');
        return { text: encoded };
      }
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Either text or file is required for encoding');
    }
    
    // decode
    if (!text) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Text is required for decoding');
    }
    
    try {
      const decoded = Buffer.from(text, encoding === 'base64url' ? 'base64url' : 'base64');
      
      // Try to detect if it's text
      const str = decoded.toString('utf-8');
      const isText = !decoded.some((byte, i) => {
        if (byte === 0) return true;
        if (byte < 32 && byte !== 10 && byte !== 13 && byte !== 9) return true;
        return false;
      });
      
      if (isText) {
        return { text: str };
      }
      
      return {
        data: decoded,
        mimeType: 'application/octet-stream',
        filename: 'decoded.bin',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid Base64 string');
    }
  },
};

register(tool);
export default tool;
