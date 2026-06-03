import { z } from 'zod';
import { PDFDocument } from 'pdf-lib';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  password: z.string().min(1, 'Password is required'),
  ownerPassword: z.string().optional(),
});

const tool: Tool = {
  name: 'pdf-encrypt',
  description: 'Encrypt PDF with password protection',
  category: 'pdf',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, password, ownerPassword } = inputSchema.parse(input);

    try {
      const pdfDoc = await PDFDocument.load(file, { ignoreEncryption: false });

      // pdf-lib 支持加密但类型定义不完整，使用 as any 绕过
      const pdfBytes = await pdfDoc.save({
        userPassword: password,
        ownerPassword: ownerPassword || password,
      } as any);

      return {
        data: Buffer.from(pdfBytes),
        mimeType: 'application/pdf',
        filename: 'encrypted.pdf',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to encrypt PDF: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
