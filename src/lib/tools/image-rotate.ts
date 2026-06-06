import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer).optional(),
  files: z.array(z.instanceof(Buffer)).optional(),
  angle: z.number().int().default(0),
  background: z.string().default('#00000000'), // Transparent by default
  flip: z.enum(['none', 'horizontal', 'vertical']).default('none'),
});

async function rotateSingle(
  file: Buffer,
  opts: { angle: number; background: string; flip: string }
): Promise<ToolResult> {
  try {
    const image = sharp(file);
    const metadata = await image.metadata();

    // Normalize angle to 0-360
    const normalizedAngle = ((opts.angle % 360) + 360) % 360;

    let pipeline = sharp(file).rotate(normalizedAngle, { background: opts.background });

    // Apply flip
    if (opts.flip === 'horizontal') {
      pipeline = pipeline.flop();
    } else if (opts.flip === 'vertical') {
      pipeline = pipeline.flip();
    }

    const rotated = await pipeline.toBuffer();

    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    return {
      data: rotated,
      mimeType: mimeTypes[metadata.format || 'png'] || 'image/png',
      filename: `rotated.${metadata.format || 'png'}`,
    };
  } catch (e) {
    throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to rotate image: ${(e as Error).message}`);
  }
}

const tool: Tool = {
  name: 'image-rotate',
  description: 'Rotate image by specified angle',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, files, angle, background, flip } = inputSchema.parse(input);

    // Normalize to array
    const fileList = files?.length ? files : file ? [file] : [];
    if (fileList.length === 0) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least one file is required');
    }

    const rotateOpts = { angle, background, flip };

    // Single file mode — return as before
    if (fileList.length === 1) {
      return rotateSingle(fileList[0], rotateOpts);
    }

    // Batch mode
    const results: Array<{ filename: string; mimeType: string; data: string }> = [];
    const errors: Array<{ index: number; message: string }> = [];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const result = await rotateSingle(fileList[i], rotateOpts);
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
