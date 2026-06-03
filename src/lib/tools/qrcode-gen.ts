import { z } from 'zod';
import QRCode from 'qrcode';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string().min(1),
  format: z.enum(['png', 'svg', 'terminal']).default('png'),
  size: z.number().int().min(50).max(1000).default(256),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).default('M'),
});

const tool: Tool = {
  name: 'qrcode-gen',
  description: 'Generate QR codes from text or URLs',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, format, size, errorCorrectionLevel } = inputSchema.parse(input);

    try {
      if (format === 'svg') {
        const svg = await QRCode.toString(text, {
          type: 'svg',
          width: size,
          errorCorrectionLevel,
        });
        return {
          text: svg,
          mimeType: 'image/svg+xml',
          filename: 'qrcode.svg',
        };
      }

      if (format === 'terminal') {
        const terminal = await QRCode.toString(text, {
          type: 'terminal',
          errorCorrectionLevel,
          small: true,
        });
        return { text: terminal };
      }

      // PNG format
      const buffer = await QRCode.toBuffer(text, {
        width: size,
        errorCorrectionLevel,
        type: 'png',
      });

      return {
        data: buffer.toString('base64'),
        mimeType: 'image/png',
        filename: 'qrcode.png',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, `QR generation failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
