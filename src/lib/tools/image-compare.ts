import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  before: z.instanceof(Buffer),
  after: z.instanceof(Buffer),
  mode: z.enum(['side-by-side', 'overlay', 'diff']).default('side-by-side'),
  maxWidth: z.number().int().min(100).max(4000).default(800),
  quality: z.number().int().min(1).max(100).default(85),
});

const tool: Tool = {
  name: 'image-compare',
  description: 'Compare two images side by side or with overlay',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { before, after, mode, maxWidth, quality } = inputSchema.parse(input);

    try {
      const beforeMeta = await sharp(before).metadata();
      const afterMeta = await sharp(after).metadata();

      const bw = Math.min(beforeMeta.width || maxWidth, maxWidth);
      const bh = Math.min(beforeMeta.height || maxWidth, maxWidth);
      const aw = Math.min(afterMeta.width || maxWidth, maxWidth);
      const ah = Math.min(afterMeta.height || maxWidth, maxWidth);

      let resultBuffer: Buffer;

      if (mode === 'side-by-side') {
        const targetHeight = Math.min(bh, ah, 600);
        const beforeResized = await sharp(before)
          .resize({ height: targetHeight, withoutEnlargement: true })
          .toBuffer();
        const afterResized = await sharp(after)
          .resize({ height: targetHeight, withoutEnlargement: true })
          .toBuffer();

        const beforeRMeta = await sharp(beforeResized).metadata();
        const afterRMeta = await sharp(afterResized).metadata();
        const totalWidth = (beforeRMeta.width || 0) + (afterRMeta.width || 0);

        resultBuffer = await sharp({
          create: {
            width: totalWidth,
            height: targetHeight,
            channels: 3,
            background: { r: 240, g: 240, b: 240 },
          },
        })
          .composite([
            { input: beforeResized, left: 0, top: 0 },
            { input: afterResized, left: beforeRMeta.width || 0, top: 0 },
          ])
          .jpeg({ quality })
          .toBuffer();
      } else if (mode === 'diff') {
        const targetW = Math.min(bw, aw, maxWidth);
        const targetH = Math.min(bh, ah, maxWidth);

        const beforeResized = await sharp(before)
          .resize(targetW, targetH, { fit: 'cover' })
          .raw()
          .toBuffer();
        const afterResized = await sharp(after)
          .resize(targetW, targetH, { fit: 'cover' })
          .raw()
          .toBuffer();

        const diffBuffer = Buffer.alloc(targetW * targetH * 3);
        for (let i = 0; i < diffBuffer.length; i += 3) {
          diffBuffer[i] = Math.min(255, Math.abs(beforeResized[i] - afterResized[i]) * 5);
          diffBuffer[i + 1] = Math.min(255, Math.abs(beforeResized[i + 1] - afterResized[i + 1]) * 5);
          diffBuffer[i + 2] = Math.min(255, Math.abs(beforeResized[i + 2] - afterResized[i + 2]) * 5);
        }

        resultBuffer = await sharp(diffBuffer, { raw: { width: targetW, height: targetH, channels: 3 } })
          .jpeg({ quality })
          .toBuffer();
      } else {
        // Overlay mode - blend both images
        const targetW = Math.min(bw, aw, maxWidth);
        const targetH = Math.min(bh, ah, maxWidth);

        const beforeResized = await sharp(before)
          .resize(targetW, targetH, { fit: 'cover' })
          .toBuffer();
        const afterResized = await sharp(after)
          .resize(targetW, targetH, { fit: 'cover' })
          .toBuffer();

        resultBuffer = await sharp(beforeResized)
          .composite([{ input: afterResized, blend: 'difference' }])
          .jpeg({ quality })
          .toBuffer();
      }

      return {
        data: resultBuffer,
        mimeType: 'image/jpeg',
        filename: `compare_${mode}.jpg`,
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Image comparison failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
