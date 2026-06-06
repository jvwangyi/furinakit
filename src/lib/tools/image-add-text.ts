import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  text: z.string().min(1),
  fontSize: z.number().int().min(10).max(500).default(48),
  color: z.string().default('#ffffff'),
  x: z.number().min(0).max(100).default(50), // percentage from left
  y: z.number().min(0).max(100).default(50), // percentage from top
  rotation: z.number().min(-180).max(180).default(0),
  fontFamily: z.string().default('sans-serif'),
  fontWeight: z.enum(['normal', 'bold']).default('bold'),
});

const tool: Tool = {
  name: 'image-add-text',
  description: 'Add text overlay to an image',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, text, fontSize, color, x, y, rotation, fontFamily, fontWeight } = inputSchema.parse(input);

    try {
      const metadata = await sharp(file).metadata();
      const imgWidth = metadata.width || 800;
      const imgHeight = metadata.height || 600;

      const posX = Math.round((x / 100) * imgWidth);
      const posY = Math.round((y / 100) * imgHeight);

      // Build SVG text overlay
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      // Split text into lines for multiline support
      const lines = escapedText.split('\n');
      const lineHeight = fontSize * 1.3;

      let textElements = '';
      for (let i = 0; i < lines.length; i++) {
        const dy = i === 0 ? 0 : lineHeight * i;
        textElements += `<tspan x="${posX}" dy="${i === 0 ? 0 : lineHeight}">${lines[i]}</tspan>`;
      }

      const rotateTransform = rotation !== 0 ? ` transform="rotate(${rotation} ${posX} ${posY})"` : '';

      const svgOverlay = Buffer.from(`
        <svg width="${imgWidth}" height="${imgHeight}">
          <style>
            text {
              font-family: ${fontFamily};
              font-size: ${fontSize}px;
              font-weight: ${fontWeight};
              fill: ${color};
              stroke: rgba(0,0,0,0.3);
              stroke-width: ${Math.max(1, fontSize / 30)};
            }
          </style>
          <text x="${posX}" y="${posY}" text-anchor="middle" dominant-baseline="central"${rotateTransform}>
            ${textElements}
          </text>
        </svg>
      `);

      const result = await sharp(file)
        .composite([{ input: svgOverlay, top: 0, left: 0 }])
        .png()
        .toBuffer();

      return {
        data: result,
        mimeType: 'image/png',
        filename: 'text-overlay.png',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Image text overlay failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
