import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string().min(1),
  format: z.enum(['png', 'jpg', 'jpeg', 'webp']).default('png'),
});

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const EXT_MAP: Record<string, string> = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  webp: 'webp',
};

const tool: Tool = {
  name: 'base64-to-image',
  description: 'Convert a Base64 encoded string to an image file',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, format } = inputSchema.parse(input);

    try {
      // Strip data URI prefix if present
      let base64Str = text;
      if (base64Str.includes(',')) {
        base64Str = base64Str.split(',')[1];
      }

      // Remove whitespace
      base64Str = base64Str.replace(/\s/g, '');

      const buffer = Buffer.from(base64Str, 'base64');

      if (buffer.length === 0) {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid Base64 string: decoded to empty buffer');
      }

      // Use sharp to convert to desired format
      let outputBuffer: Buffer;
      const sharpInstance = sharp(buffer);

      if (format === 'jpg' || format === 'jpeg') {
        outputBuffer = await sharpInstance.jpeg().toBuffer();
      } else if (format === 'webp') {
        outputBuffer = await sharpInstance.webp().toBuffer();
      } else {
        outputBuffer = await sharpInstance.png().toBuffer();
      }

      return {
        data: outputBuffer,
        mimeType: MIME_MAP[format],
        filename: `decoded.${EXT_MAP[format]}`,
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert Base64 to image: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
