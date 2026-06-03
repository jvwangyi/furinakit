import { z } from 'zod';
import { PDFDocument, degrees } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  rotation: z.number().int().multipleOf(90),
  pages: z.array(z.number().int().min(1)).optional(), // 1-indexed page numbers
});

const tool: Tool = {
  name: 'pdf-rotate',
  description: 'Rotate pages in a PDF file',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, rotation, pages } = inputSchema.parse(input);

    try {
      const pdfDoc = await PDFDocument.load(file);
      const totalPages = pdfDoc.getPageCount();

      // Normalize rotation to 0, 90, 180, 270
      const normalizedRotation = ((rotation % 360) + 360) % 360;

      if (pages && pages.length > 0) {
        // Rotate specific pages
        for (const pageNum of pages) {
          if (pageNum < 1 || pageNum > totalPages) {
            throw new ToolError(ErrorCode.INVALID_INPUT, `Page ${pageNum} does not exist (total: ${totalPages})`);
          }
          const page = pdfDoc.getPage(pageNum - 1);
          page.setRotation(degrees(normalizedRotation));
        }
      } else {
        // Rotate all pages
        const allPages = pdfDoc.getPages();
        for (const page of allPages) {
          page.setRotation(degrees(normalizedRotation));
        }
      }

      const rotatedBytes = await pdfDoc.save();

      return {
        data: Buffer.from(rotatedBytes),
        mimeType: 'application/pdf',
        filename: 'rotated.pdf',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to rotate PDF: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
