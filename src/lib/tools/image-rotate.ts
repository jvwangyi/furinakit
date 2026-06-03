import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  angle: z.number().int().default(0),
  background: z.string().default('#00000000'), // Transparent by default
  flip: z.enum(['none', 'horizontal', 'vertical']).default('none'),
});

const tool: Tool = {
  name: 'image-rotate',
  description: 'Rotate image by specified angle',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, angle, background, flip } = inputSchema.parse(input);

    try {
      const image = sharp(file);
      const metadata = await image.metadata();

      // Normalize angle to 0-360
      const normalizedAngle = ((angle % 360) + 360) % 360;

      let pipeline = sharp(file).rotate(normalizedAngle, { background });

      // Apply flip
      if (flip === 'horizontal') {
        pipeline = pipeline.flop();
      } else if (flip === 'vertical') {
        pipeline = pipeline.flip();
      }

      const rotated = await pipeline.toBuffer();

      const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      };

      return {
        data: rotated,
        mimeType: mimeTypes[metadata.format || 'png'] || 'image/png',
        filename: `rotated.${metadata.format || 'png'}`,
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to rotate image: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
