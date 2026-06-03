import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  text: z.string().min(1),
  position: z.enum(['center', 'bottom-right', 'bottom-left', 'top-right', 'top-left']).default('bottom-right'),
  opacity: z.number().min(0).max(1).default(0.5),
  fontSize: z.number().int().min(10).max(200).default(48),
  color: z.string().default('#ffffff'),
});

const tool: Tool = {
  name: 'image-add-watermark',
  description: 'Add text watermark to image',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, text, position, opacity, fontSize, color } = inputSchema.parse(input);

    try {
      const metadata = await sharp(file).metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 600;

      // Calculate position
      let x: number;
      let y: number;
      const padding = 20;

      switch (position) {
        case 'center':
          x = width / 2;
          y = height / 2;
          break;
        case 'bottom-right':
          x = width - padding;
          y = height - padding;
          break;
        case 'bottom-left':
          x = padding;
          y = height - padding;
          break;
        case 'top-right':
          x = width - padding;
          y = padding + fontSize;
          break;
        case 'top-left':
          x = padding;
          y = padding + fontSize;
          break;
      }

      // Create SVG watermark
      const svg = `
        <svg width="${width}" height="${height}">
          <style>
            .watermark {
              font-size: ${fontSize}px;
              fill: ${color};
              opacity: ${opacity};
              font-family: Arial, sans-serif;
            }
          </style>
          <text
            x="${x}"
            y="${y}"
            class="watermark"
            text-anchor="${position.includes('right') ? 'end' : position === 'center' ? 'middle' : 'start'}"
            dominant-baseline="${position.includes('bottom') ? 'auto' : 'hanging'}"
          >${text}</text>
        </svg>
      `;

      const watermarked = await sharp(file)
        .composite([{
          input: Buffer.from(svg),
          top: 0,
          left: 0,
        }])
        .toBuffer();

      const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };

      return {
        data: watermarked,
        mimeType: mimeTypes[metadata.format || 'png'] || 'image/png',
        filename: `watermarked.${metadata.format || 'png'}`,
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to add watermark: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
