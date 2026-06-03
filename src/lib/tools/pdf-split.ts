import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  pages: z.array(z.number()).optional(),
  ranges: z.array(z.object({
    start: z.number(),
    end: z.number(),
  })).optional(),
});

const tool: Tool = {
  name: 'pdf-split',
  description: 'Split PDF into separate pages or page ranges',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, pages, ranges } = inputSchema.parse(input);

    try {
      const pdf = await PDFDocument.load(file);
      const totalPages = pdf.getPageCount();

      let pageIndices: number[] = [];

      if (pages) {
        pageIndices = pages.filter(p => p >= 1 && p <= totalPages).map(p => p - 1);
      } else if (ranges) {
        for (const range of ranges) {
          for (let i = range.start; i <= Math.min(range.end, totalPages); i++) {
            if (i >= 1) pageIndices.push(i - 1);
          }
        }
      } else {
        pageIndices = Array.from({ length: totalPages }, (_, i) => i);
      }

      if (pageIndices.length === 0) {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'No valid pages specified');
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();

      return {
        data: Buffer.from(pdfBytes),
        mimeType: 'application/pdf',
        filename: 'split.pdf',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `PDF split failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
