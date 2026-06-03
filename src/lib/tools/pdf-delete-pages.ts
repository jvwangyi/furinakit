import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  pages: z.array(z.number().int().min(1)).min(1), // 1-indexed page numbers to delete
});

const tool: Tool = {
  name: 'pdf-delete-pages',
  description: 'Delete specific pages from a PDF file',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, pages } = inputSchema.parse(input);

    try {
      const srcDoc = await PDFDocument.load(file);
      const totalPages = srcDoc.getPageCount();

      // Validate page numbers
      const pagesToDelete = new Set(pages);
      for (const pageNum of pagesToDelete) {
        if (pageNum < 1 || pageNum > totalPages) {
          throw new ToolError(ErrorCode.INVALID_INPUT, `Page ${pageNum} does not exist (total: ${totalPages})`);
        }
      }

      // Build list of pages to keep (0-indexed)
      const keepPages: number[] = [];
      for (let i = 0; i < totalPages; i++) {
        if (!pagesToDelete.has(i + 1)) {
          keepPages.push(i);
        }
      }

      if (keepPages.length === 0) {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'Cannot delete all pages from PDF');
      }

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(srcDoc, keepPages);
      for (const page of copiedPages) {
        newDoc.addPage(page);
      }

      const resultBytes = await newDoc.save();

      return {
        data: Buffer.from(resultBytes),
        mimeType: 'application/pdf',
        filename: 'deleted-pages.pdf',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to delete pages: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
