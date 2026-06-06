import { z } from 'zod';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  text: z.string().min(1, 'Watermark text is required'),
  fontSize: z.number().min(10).max(200).default(50),
  opacity: z.number().min(0).max(1).default(0.3),
  color: z.string().default('#888888'),
  position: z.enum(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'custom']).default('center'),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
});

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : { r: 0.5, g: 0.5, b: 0.5 };
}

const tool: Tool = {
  name: 'pdf-watermark',
  description: 'Add text watermark to PDF',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, text, fontSize, opacity, color, position, x: customX, y: customY } = inputSchema.parse(input);

    try {
      const pdfDoc = await PDFDocument.load(file);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const watermarkColor = hexToRgb(color);

      const pages = pdfDoc.getPages();
      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x: number;
        let y: number;

        if (position === 'custom' && customX !== undefined && customY !== undefined) {
          x = (customX / 100) * width - textWidth / 2;
          y = (1 - customY / 100) * height - textHeight / 2;
        } else {
          switch (position) {
            case 'top-left':
              x = 20;
              y = height - textHeight - 20;
              break;
            case 'top-right':
              x = width - textWidth - 20;
              y = height - textHeight - 20;
              break;
            case 'bottom-left':
              x = 20;
              y = 20;
              break;
            case 'bottom-right':
              x = width - textWidth - 20;
              y = 20;
              break;
            case 'center':
            default:
              x = (width - textWidth) / 2;
              y = (height - textHeight) / 2;
              break;
          }
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(watermarkColor.r, watermarkColor.g, watermarkColor.b),
          opacity,
        });
      }

      const pdfBytes = await pdfDoc.save();

      return {
        data: Buffer.from(pdfBytes),
        mimeType: 'application/pdf',
        filename: 'watermarked.pdf',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to add watermark: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
