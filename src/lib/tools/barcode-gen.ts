import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

const inputSchema = z.object({
  text: z.string().min(1),
  format: z.enum(['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC', 'ITF14']).default('CODE128'),
  width: z.number().int().min(1).max(4).default(2),
  height: z.number().int().min(30).max(200).default(100),
  displayValue: z.boolean().default(true),
  fontSize: z.number().int().min(10).max(40).default(16),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ffffff'),
  lineColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
});

const tool: Tool = {
  name: 'barcode-gen',
  description: 'Generate barcodes in various formats (Code128, Code39, EAN13, EAN8, UPC-A, ITF-14)',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, format, width, height, displayValue, fontSize, background, lineColor } = inputSchema.parse(input);

    // Validate format-specific requirements
    if (format === 'EAN13' && !/^\d{12,13}$/.test(text)) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'EAN13 requires 12-13 digits');
    }
    if (format === 'EAN8' && !/^\d{7,8}$/.test(text)) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'EAN8 requires 7-8 digits');
    }
    if (format === 'UPC' && !/^\d{11,12}$/.test(text)) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'UPC-A requires 11-12 digits');
    }
    if (format === 'ITF14' && !/^\d{13,14}$/.test(text)) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'ITF-14 requires 13-14 digits');
    }
    if (format === 'CODE39' && !/^[A-Z0-9\-. $/+%]*$/.test(text)) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'CODE39 only supports uppercase letters, digits, and - . $ / + % SPACE');
    }

    try {
      const canvas = createCanvas(width * text.length * 10 + 100, height + 60);
      JsBarcode(canvas, text, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        background,
        lineColor,
        margin: 10,
      });

      const buffer = canvas.toBuffer('image/png');

      return {
        data: buffer,
        mimeType: 'image/png',
        filename: `barcode_${format}_${text}.png`,
      };
    } catch (err: any) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Barcode generation failed: ${err.message || 'Unknown error'}`);
    }
  },
};

register(tool);
export default tool;
