import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
  lockAspectRatio: z.boolean().default(true),
  format: z.enum(['jpeg', 'png', 'webp', 'avif']).optional(),
});

const tool: Tool = {
  name: 'image-resize',
  description: 'Resize images with various options',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, width, height, fit, lockAspectRatio, format } = inputSchema.parse(input);

    if (!width && !height) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least one of width or height is required');
    }

    try {
      const image = sharp(file);
      const metadata = await image.metadata();

      // When lockAspectRatio is true and both dimensions are provided, use 'inside' to maintain ratio
      const effectiveFit = lockAspectRatio && width && height ? 'inside' : fit;
      const resized = image.resize(width, height, { fit: effectiveFit });

      const outputFormat = format || metadata.format || 'png';
      const buffer = await resized.toFormat(outputFormat as keyof sharp.FormatEnum).toBuffer();

      const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        avif: 'image/avif',
      };

      return {
        data: buffer,
        mimeType: mimeTypes[outputFormat] || 'image/png',
        filename: `resized.${outputFormat}`,
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Image resize failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
