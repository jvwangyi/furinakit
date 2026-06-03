import { z } from 'zod';
import ffmpeg from 'fluent-ffmpeg';
import { createTempDir, cleanTempDir } from '../tmp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
  maxWidth: z.number().int().min(100).max(3840).optional(),
});

const tool: Tool = {
  name: 'video-compress',
  description: 'Compress video to reduce file size',
  category: 'video',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, quality, maxWidth } = inputSchema.parse(input);

    const tmpDirPath = createTempDir();
    const inputPath = join(tmpDirPath, `input-${randomUUID()}.mp4`);
    const outputPath = join(tmpDirPath, `output-${randomUUID()}.mp4`);

    try {
      await writeFile(inputPath, file);

      // Quality presets
      const presets: Record<string, { crf: number; preset: string }> = {
        low: { crf: 35, preset: 'ultrafast' },
        medium: { crf: 28, preset: 'medium' },
        high: { crf: 23, preset: 'slow' },
      };

      const { crf, preset } = presets[quality];

      await new Promise<void>((resolve, reject) => {
        const TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟超时
        let command = ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            `-crf ${crf}`,
            `-preset ${preset}`,
            '-movflags +faststart',
          ]);

        if (maxWidth) {
          command = command.size(`${maxWidth}x?`);
        }

        const timer = setTimeout(() => {
          command.kill('SIGKILL');
          reject(new Error('视频处理超时（5分钟限制）'));
        }, TIMEOUT_MS);

        command
          .format('mp4')
          .output(outputPath)
          .on('end', () => { clearTimeout(timer); resolve(); })
          .on('error', (err) => { clearTimeout(timer); reject(new Error(err.message)); })
          .run();
      });

      const outputBuffer = await readFile(outputPath);

      // Cleanup
      cleanTempDir(tmpDirPath);

      return {
        data: outputBuffer,
        mimeType: 'video/mp4',
        filename: 'compressed.mp4',
      };
    } catch (e) {
      // Cleanup on error
      cleanTempDir(tmpDirPath);
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to compress video: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
