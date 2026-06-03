import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  outputFormat: z.enum(['png', 'jpg', 'jpeg', 'webp']).optional(),
  addDataUri: z.boolean().default(true),
});

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const tool: Tool = {
  name: 'image-to-base64',
  description: 'Convert an image file to Base64 encoded string',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, outputFormat, addDataUri } = inputSchema.parse(input);

    try {
      let buffer = file;
      let format: string = outputFormat || 'png';

      // Detect original format if no conversion requested
      if (!outputFormat) {
        const metadata = await sharp(file).metadata();
        format = metadata.format || 'png';
      }

      // Convert if needed
      if (outputFormat) {
        if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
          buffer = await sharp(file).jpeg().toBuffer();
          format = 'jpeg';
        } else if (outputFormat === 'png') {
          buffer = await sharp(file).png().toBuffer();
          format = 'png';
        } else if (outputFormat === 'webp') {
          buffer = await sharp(file).webp().toBuffer();
          format = 'webp';
        }
      }

      const base64 = buffer.toString('base64');
      const mimeType = MIME_MAP[format] || 'image/png';

      const result = addDataUri
        ? `data:${mimeType};base64,${base64}`
        : base64;

      return { text: result };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert image to Base64: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
