import { z } from 'zod';
import ffmpeg from 'fluent-ffmpeg';
import { createTempDir, cleanTempDir } from '../tmp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  mimeType: z.string().default('video/mp4'),
  timestamp: z.string().default('00:00:01'), // HH:MM:SS or seconds
  width: z.number().int().min(100).max(1920).default(640),
  format: z.enum(['png', 'jpg']).default('jpg'),
  quality: z.number().int().min(1).max(100).default(80),
});

const tool: Tool = {
  name: 'video-thumbnail',
  description: 'Extract thumbnail/frame from video at specified timestamp',
  category: 'video',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, mimeType, timestamp, width, format, quality } = inputSchema.parse(input);

    const tmpDirPath = createTempDir();
    const id = randomUUID();
    const ext = mimeType.split('/')[1] || 'mp4';
    const inputPath = join(tmpDirPath, `input-${id}.${ext}`);
    const outputPath = join(tmpDirPath, `thumb-${id}.${format}`);

    try {
      await writeFile(inputPath, file);

      await new Promise<void>((resolve, reject) => {
        const TIMEOUT_MS = 30 * 1000; // 30s timeout
        let command = ffmpeg(inputPath)
          .seekInput(timestamp)
          .frames(1)
          .videoFilters(`scale=${width}:-1`);

        if (format === 'jpg') {
          command = command.outputOptions(['-q:v', Math.round((100 - quality) / 10 + 1).toString()]);
        }

        const timer = setTimeout(() => {
          command.kill('SIGKILL');
          reject(new Error('Thumbnail extraction timeout'));
        }, TIMEOUT_MS);

        command
          .output(outputPath)
          .on('end', () => { clearTimeout(timer); resolve(); })
          .on('error', (err) => { clearTimeout(timer); reject(new Error(err.message)); })
          .run();
      });

      const resultBuffer = await readFile(outputPath);

      cleanTempDir(tmpDirPath);

      return {
        data: resultBuffer,
        mimeType: `image/${format}`,
        filename: `thumbnail_${timestamp.replace(/:/g, '-')}.${format}`,
      };
    } catch (e) {
      cleanTempDir(tmpDirPath);
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Thumbnail extraction failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
