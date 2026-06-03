import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  files: z.array(z.instanceof(Buffer)).min(2, 'At least 2 images required'),
  direction: z.enum(['horizontal', 'vertical']).default('horizontal'),
  background: z.string().default('#ffffff'),
});

const tool: Tool = {
  name: 'image-merge',
  description: 'Merge multiple images side by side or stacked',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { files, direction, background } = inputSchema.parse(input);

    try {
      // Get metadata for all images
      const images = await Promise.all(
        files.map(async (file) => {
          const metadata = await sharp(file).metadata();
          return {
            buffer: file,
            width: metadata.width || 0,
            height: metadata.height || 0,
          };
        })
      );

      let totalWidth: number;
      let totalHeight: number;

      if (direction === 'horizontal') {
        totalWidth = images.reduce((sum, img) => sum + img.width, 0);
        totalHeight = Math.max(...images.map(img => img.height));
      } else {
        totalWidth = Math.max(...images.map(img => img.width));
        totalHeight = images.reduce((sum, img) => sum + img.height, 0);
      }

      // Create composite array
      const composite: sharp.OverlayOptions[] = [];
      let currentX = 0;
      let currentY = 0;

      for (const img of images) {
        composite.push({
          input: img.buffer,
          left: currentX,
          top: currentY,
        });

        if (direction === 'horizontal') {
          currentX += img.width;
        } else {
          currentY += img.height;
        }
      }

      const merged = await sharp({
        create: {
          width: totalWidth,
          height: totalHeight,
          channels: 4,
          background: background,
        },
      })
        .composite(composite)
        .png()
        .toBuffer();

      return {
        data: merged,
        mimeType: 'image/png',
        filename: 'merged.png',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to merge images: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
