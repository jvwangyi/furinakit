import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer).optional(),
  files: z.array(z.instanceof(Buffer)).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
  lockAspectRatio: z.boolean().default(true),
  format: z.enum(['jpeg', 'png', 'webp', 'avif']).optional(),
});

async function resizeSingle(
  file: Buffer,
  opts: { width?: number; height?: number; fit: string; lockAspectRatio: boolean; format?: string }
): Promise<ToolResult> {
  if (!opts.width && !opts.height) {
    throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least one of width or height is required');
  }

  try {
    const image = sharp(file);
    const metadata = await image.metadata();

    const effectiveFit = opts.lockAspectRatio && opts.width && opts.height ? 'inside' : opts.fit;
    const resized = image.resize(opts.width, opts.height, { fit: effectiveFit as 'cover' | 'contain' | 'fill' | 'inside' | 'outside' });

    const outputFormat = opts.format || metadata.format || 'png';
    const buffer = await resized.toFormat(outputFormat as keyof sharp.FormatEnum).toBuffer();

    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };

    return {
      data: buffer,
      mimeType: mimeTypes[outputFormat] || 'image/png',
      filename: `resized.${outputFormat}`,
    };
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(ErrorCode.PROCESS_FAILED, `Image resize failed: ${(e as Error).message}`);
  }
}

const tool: Tool = {
  name: 'image-resize',
  description: 'Resize images with various options',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, files, width, height, fit, lockAspectRatio, format } = inputSchema.parse(input);

    // Normalize to array
    const fileList = files?.length ? files : file ? [file] : [];
    if (fileList.length === 0) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least one file is required');
    }

    const resizeOpts = { width, height, fit, lockAspectRatio, format };

    // Single file mode — return as before
    if (fileList.length === 1) {
      return resizeSingle(fileList[0], resizeOpts);
    }

    // Batch mode
    const results: Array<{ filename: string; mimeType: string; data: string }> = [];
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const result = await resizeSingle(fileList[i], resizeOpts);
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
