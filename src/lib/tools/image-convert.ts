import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  format: z.enum(['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif']),
  quality: z.number().min(1).max(100).optional(),
});

const tool: Tool = {
  name: 'image-convert',
  description: 'Convert image between formats (JPEG, PNG, WebP, AVIF, TIFF, GIF)',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, format, quality } = inputSchema.parse(input);

    try {
      let image = sharp(file);

      const options: Record<string, number> = {};
      if (quality && ['jpeg', 'webp', 'avif'].includes(format)) {
        options.quality = quality;
      }

      const buffer = await image.toFormat(format as keyof sharp.FormatEnum, options).toBuffer();

      const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        avif: 'image/avif',
        tiff: 'image/tiff',
        gif: 'image/gif',
      };

      return {
        data: buffer,
        mimeType: mimeTypes[format],
        filename: `converted.${format}`,
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Image convert failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
