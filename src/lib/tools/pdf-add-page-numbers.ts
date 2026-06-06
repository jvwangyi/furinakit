import { z } from 'zod';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const PositionEnum = z.enum([
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'custom',
]);

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  position: PositionEnum.default('bottom-center'),
  fontSize: z.number().min(6).max(72).default(12),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
});

const tool: Tool = {
  name: 'pdf-add-page-numbers',
  description: 'Add page numbers to a PDF file',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, position, fontSize, x: customX, y: customY } = inputSchema.parse(input);

    try {
      const pdfDoc = await PDFDocument.load(file);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const totalPages = pdfDoc.getPageCount();
      const pages = pdfDoc.getPages();

      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const pageNum = `${i + 1}`;
        const textWidth = font.widthOfTextAtSize(pageNum, fontSize);
        const textHeight = fontSize;

        let x: number;
        let y: number;

        const margin = 30;

        if (position === 'custom' && customX !== undefined && customY !== undefined) {
          x = (customX / 100) * width;
          y = (1 - customY / 100) * height;
        } else {
          switch (position) {
            case 'top-left':
              x = margin;
              y = height - margin - textHeight;
              break;
            case 'top-center':
              x = (width - textWidth) / 2;
              y = height - margin - textHeight;
              break;
            case 'top-right':
              x = width - margin - textWidth;
              y = height - margin - textHeight;
              break;
            case 'bottom-left':
              x = margin;
              y = margin;
              break;
            case 'bottom-center':
              x = (width - textWidth) / 2;
              y = margin;
              break;
            case 'bottom-right':
              x = width - margin - textWidth;
              y = margin;
              break;
            default:
              x = (width - textWidth) / 2;
              y = margin;
          }
        }

        page.drawText(pageNum, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }

      const resultBytes = await pdfDoc.save();

      return {
        data: Buffer.from(resultBytes),
        mimeType: 'application/pdf',
        filename: 'numbered.pdf',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to add page numbers: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
