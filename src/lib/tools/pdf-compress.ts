import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
});

const tool: Tool = {
  name: 'pdf-compress',
  description: 'Compress PDF file to reduce size',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, quality } = inputSchema.parse(input);

    try {
      const pdfDoc = await PDFDocument.load(file, { ignoreEncryption: false });

      switch (quality) {
        case 'low':
          // 轻度压缩：只用对象流，保留所有内容
          pdfDoc.setTitle(pdfDoc.getTitle() || '');
          break;
        case 'medium':
          // 中度压缩：对象流 + 清理元数据
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('');
          pdfDoc.setCreator('');
          break;
        case 'high':
          // 高度压缩：对象流 + 清理元数据 + 清理所有页面的注释
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('');
          pdfDoc.setCreator('');
          // 移除所有页面的注释（减小体积）
          const pages = pdfDoc.getPages();
          for (const page of pages) {
            const annots = page.node.get(pdfDoc.context.obj('Annots'));
            if (annots) {
              page.node.delete(pdfDoc.context.obj('Annots'));
            }
          }
          break;
      }

      const compressedBytes = await pdfDoc.save({
        useObjectStreams: quality !== 'low',
        addDefaultPage: false,
        objectsPerTick: quality === 'high' ? 50 : undefined,
      });

      return {
        data: Buffer.from(compressedBytes),
        mimeType: 'application/pdf',
        filename: 'compressed.pdf',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to compress PDF: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
