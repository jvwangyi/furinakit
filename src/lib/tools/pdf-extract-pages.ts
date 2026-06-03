import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  pages: z.array(z.number().int().min(1)).min(1), // 1-indexed page numbers
});

const tool: Tool = {
  name: 'pdf-extract-pages',
  description: 'Extract specific pages from a PDF file',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, pages } = inputSchema.parse(input);

    try {
      const srcDoc = await PDFDocument.load(file);
      const totalPages = srcDoc.getPageCount();
      const newDoc = await PDFDocument.create();

      // Validate and deduplicate pages
      const uniquePages = [...new Set(pages)].sort((a, b) => a - b);

      for (const pageNum of uniquePages) {
        if (pageNum < 1 || pageNum > totalPages) {
          throw new ToolError(ErrorCode.INVALID_INPUT, `Page ${pageNum} does not exist (total: ${totalPages})`);
        }

        const [copiedPage] = await newDoc.copyPages(srcDoc, [pageNum - 1]);
        newDoc.addPage(copiedPage);
      }

      const extractedBytes = await newDoc.save();

      return {
        data: Buffer.from(extractedBytes),
        mimeType: 'application/pdf',
        filename: 'extracted.pdf',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to extract pages: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
