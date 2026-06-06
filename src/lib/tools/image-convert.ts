import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer).optional(),
  files: z.array(z.instanceof(Buffer)).optional(),
  format: z.enum(['jpeg', 'png', 'webp', 'avif', 'tiff', 'gif']),
  quality: z.number().min(1).max(100).optional(),
});

async function convertSingle(file: Buffer, format: string, quality?: number): Promise<ToolResult> {
  try {
    let image = sharp(file);

    const options: Record<string, number> = {};
    if (quality && ['jpeg', 'webp', 'avif'].includes(format)) {
      options.quality = quality;
    }

    const buffer = await image.toFormat(format as keyof sharp.FormatEnum, options).toBuffer();

    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      tiff: 'image/tiff',
      gif: 'image/gif',
    };

    return {
      data: buffer,
      mimeType: mimeTypes[format],
      filename: `converted.${format}`,
    };
  } catch (e) {
    throw new ToolError(ErrorCode.PROCESS_FAILED, `Image convert failed: ${(e as Error).message}`);
  }
}

const tool: Tool = {
  name: 'image-convert',
  description: 'Convert image between formats (JPEG, PNG, WebP, AVIF, TIFF, GIF)',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, files, format, quality } = inputSchema.parse(input);

    // Normalize to array
    const fileList = files?.length ? files : file ? [file] : [];
    if (fileList.length === 0) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least one file is required');
    }

    // Single file mode — return as before
    if (fileList.length === 1) {
      return convertSingle(fileList[0], format, quality);
    }

    // Batch mode
    const results: Array<{ filename: string; mimeType: string; data: string }> = [];
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const result = await convertSingle(fileList[i], format, quality);
        results.push({
          filename: result.filename!,
          mimeType: result.mimeType!,
          data: (result.data as Buffer).toString('base64'),
        });
      } catch (e) {
        errors.push({ index: i, message: (e as Error).message });
      }
    }

    return {
      text: JSON.stringify({
        batch: true,
        total: fileList.length,
        success: results.length,
        failed: errors.length,
        results,
        errors,
      }),
    };
  },
};

register(tool);
export default tool;
