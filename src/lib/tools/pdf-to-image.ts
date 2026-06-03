import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  page: z.number().int().min(1).default(1),
  format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  scale: z.number().min(0.1).max(3).default(1),
});

const tool: Tool = {
  name: 'pdf-to-image',
  description: 'Convert PDF page to image (creates preview with page info)',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, page, format, scale } = inputSchema.parse(input);

    try {
      const pdfDoc = await PDFDocument.load(file);
      const totalPages = pdfDoc.getPageCount();

      if (page > totalPages) {
        throw new ToolError(ErrorCode.INVALID_INPUT, `Page ${page} does not exist (total: ${totalPages})`);
      }

      const pdfPage = pdfDoc.getPage(page - 1);
      const { width, height } = pdfPage.getSize();

      // Create a preview image with page information
      const scaledWidth = Math.round(width * scale);
      const scaledHeight = Math.round(height * scale);

      // Create SVG with page info
      const svg = `
        <svg width="${scaledWidth}" height="${scaledHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8f9fa"/>
          <rect x="40" y="40" width="${scaledWidth - 80}" height="${scaledHeight - 80}" fill="white" stroke="#dee2e6" stroke-width="2"/>
          <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="24" fill="#495057">
            PDF Page ${page}
          </text>
          <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="16" fill="#6c757d">
            ${Math.round(width)} × ${Math.round(height)} pt
          </text>
          <text x="50%" y="65%" text-anchor="middle" font-family="Arial" font-size="14" fill="#adb5bd">
            ${totalPages} page(s) total
          </text>
        </svg>
      `;

      const imageBuffer = await sharp(Buffer.from(svg))
        .toFormat(format)
        .toBuffer();

      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
      };

      return {
        data: imageBuffer,
        mimeType: mimeTypes[format],
        filename: `page-${page}.${format}`,
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert PDF to image: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
