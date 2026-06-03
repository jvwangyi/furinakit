import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  files: z.array(z.instanceof(Buffer)).min(2, 'At least 2 PDF files required'),
});

const tool: Tool = {
  name: 'pdf-merge',
  description: 'Merge multiple PDF files into one',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { files } = inputSchema.parse(input);
    
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      try {
        const pdf = await PDFDocument.load(file);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      } catch (e) {
        throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to process PDF: ${(e as Error).message}`);
      }
    }
    
    const pdfBytes = await mergedPdf.save();
    
    return {
      data: Buffer.from(pdfBytes),
      mimeType: 'application/pdf',
      filename: 'merged.pdf',
    };
  },
};

register(tool);
export default tool;
