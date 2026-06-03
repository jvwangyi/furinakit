import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  files: z.array(z.instanceof(Buffer)).min(1, 'At least 1 image required'),
  pageSize: z.enum(['A4', 'Letter', 'fit']).default('A4'),
});

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
};

const tool: Tool = {
  name: 'image-to-pdf',
  description: 'Convert one or more images to a single PDF file',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { files, pageSize } = inputSchema.parse(input);

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      try {
        const metadata = await sharp(file).metadata();
        const imageWidth = metadata.width || 595;
        const imageHeight = metadata.height || 842;

        let pageWidth: number;
        let pageHeight: number;

        if (pageSize === 'fit') {
          pageWidth = imageWidth;
          pageHeight = imageHeight;
        } else {
          const size = PAGE_SIZES[pageSize];
          pageWidth = size.width;
          pageHeight = size.height;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Embed image based on format
        let image;
        const format = metadata.format;
        if (format === 'png') {
          image = await pdfDoc.embedPng(file);
        } else if (format === 'jpeg' || format === 'jpg') {
          image = await pdfDoc.embedJpg(file);
        } else {
          // Convert to PNG for other formats (webp, gif, etc.)
          const pngBuffer = await sharp(file).png().toBuffer();
          image = await pdfDoc.embedPng(pngBuffer);
        }

        const { width: imgW, height: imgH } = image.scale(1);

        // Scale image to fit page while maintaining aspect ratio
        const scaleX = pageWidth / imgW;
        const scaleY = pageHeight / imgH;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = imgW * scale;
        const scaledHeight = imgH * scale;

        // Center on page
        const x = (pageWidth - scaledWidth) / 2;
        const y = (pageHeight - scaledHeight) / 2;

        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        });
      } catch (e) {
        throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to process image: ${(e as Error).message}`);
      }
    }

    const pdfBytes = await pdfDoc.save();

    return {
      data: Buffer.from(pdfBytes),
      mimeType: 'application/pdf',
      filename: 'converted.pdf',
    };
  },
};

register(tool);
export default tool;
