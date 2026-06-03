import { z } from 'zod';
import { marked } from 'marked';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string().min(1),
  fontSize: z.number().min(8).max(36).default(12),
  margin: z.number().min(0).max(200).default(50),
  pageSize: z.enum(['a4', 'letter', 'a3', 'a5']).default('a4'),
});

// Simple text extraction from markdown (strips markdown syntax for PDF rendering)
function stripMarkdown(md: string): string {
  return md
    // Headers
    .replace(/^#{1,6}\s+/gm, '')
    // Bold/italic
    .replace(/\*{1,3}(.+?)\*{1,3}/g, '$1')
    .replace(/_{1,3}(.+?)_{1,3}/g, '$1')
    // Links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[$1]')
    // Code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Blockquotes
    .replace(/^>\s+/gm, '')
    // Horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '---')
    // List markers
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // HTML tags
    .replace(/<[^>]+>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n');
}

const tool: Tool = {
  name: 'markdown-to-pdf',
  description: 'Convert Markdown text to a PDF file',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, fontSize, margin, pageSize } = inputSchema.parse(input);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Extract plain text from markdown
      const plainText = stripMarkdown(text);
      const lines = plainText.split('\n');

      // Page dimensions based on pageSize
      const pageSizes: Record<string, [number, number]> = {
        a4: [595.28, 841.89],
        letter: [612, 792],
        a3: [841.89, 1190.55],
        a5: [419.53, 595.28],
      };
      const [pageWidth, pageHeight] = pageSizes[pageSize] || pageSizes.a4;
      const contentWidth = pageWidth - margin * 2;
      const lineHeight = fontSize * 1.5;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      for (const line of lines) {
        // Check if we need a new page
        if (y < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        if (line.trim() === '') {
          y -= lineHeight * 0.5;
          continue;
        }

        // Simple word wrapping
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > contentWidth && currentLine) {
            // Draw current line
            if (y < margin + lineHeight) {
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }

            currentPage.drawText(currentLine, {
              x: margin,
              y,
              size: fontSize,
              font,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        // Draw remaining text
        if (currentLine) {
          if (y < margin + lineHeight) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }

          currentPage.drawText(currentLine, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
          y -= lineHeight;
        }
      }

      const pdfBytes = await pdfDoc.save();

      return {
        data: Buffer.from(pdfBytes),
        mimeType: 'application/pdf',
        filename: 'converted.pdf',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert Markdown to PDF: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
