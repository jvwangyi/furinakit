import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  quality: z.number().int().min(1).max(100).default(80),
  format: z.enum(['jpeg', 'webp', 'png']).optional(),
});

const tool: Tool = {
  name: 'image-compress',
  description: 'Compress images to reduce file size',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, quality, format } = inputSchema.parse(input);

    try {
      const image = sharp(file);
      const metadata = await image.metadata();

      const outputFormat = format || metadata.format || 'jpeg';

      let compressed: Buffer;

      switch (outputFormat) {
        case 'jpeg':
          compressed = await sharp(file)
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
          break;
        case 'webp':
          compressed = await sharp(file)
            .webp({ quality })
            .toBuffer();
          break;
        case 'png':
          compressed = await sharp(file)
            .png({ compressionLevel: Math.round((100 - quality) / 10) })
            .toBuffer();
          break;
        default:
          compressed = await sharp(file)
            .jpeg({ quality })
            .toBuffer();
      }

      const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };

      return {
        data: compressed,
        mimeType: mimeTypes[outputFormat] || 'image/jpeg',
        filename: `compressed.${outputFormat}`,
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to compress image: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
