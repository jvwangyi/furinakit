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
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format: HH:MM:SS'),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format: HH:MM:SS').optional(),
  duration: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Format: HH:MM:SS').optional(),
});

const tool: Tool = {
  name: 'video-trim',
  description: 'Trim video to specified duration',
  category: 'video',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, startTime, endTime, duration } = inputSchema.parse(input);

    if (!endTime && !duration) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Either endTime or duration is required');
    }

    const tmpDirPath = createTempDir();
    const inputPath = join(tmpDirPath, `input-${randomUUID()}.mp4`);
    const outputPath = join(tmpDirPath, `output-${randomUUID()}.mp4`);

    try {
      await writeFile(inputPath, file);

      await new Promise<void>((resolve, reject) => {
        const TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟超时
        const outputOptions: string[] = [
          `-ss ${startTime}`,
          '-c copy',
        ];

        if (endTime) {
          outputOptions.push(`-to ${endTime}`);
        } else if (duration) {
          outputOptions.push(`-t ${duration}`);
        }

        const command = ffmpeg(inputPath)
          .outputOptions(outputOptions)
          .format('mp4')
          .output(outputPath)
          .on('end', () => { clearTimeout(timer); resolve(); })
          .on('error', (err) => { clearTimeout(timer); reject(new Error(err.message)); });

        const timer = setTimeout(() => {
          command.kill('SIGKILL');
          reject(new Error('视频裁剪超时（5分钟限制）'));
        }, TIMEOUT_MS);

        command.run();
      });

      const outputBuffer = await readFile(outputPath);

      // Cleanup
      cleanTempDir(tmpDirPath);

      return {
        data: outputBuffer,
        mimeType: 'video/mp4',
        filename: 'trimmed.mp4',
      };
    } catch (e) {
      // Cleanup on error
      cleanTempDir(tmpDirPath);
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to trim video: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
