import { z } from 'zod';
import ffmpeg from 'fluent-ffmpeg';
import { createTempDir, cleanTempDir } from '../tmp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID, randomBytes } from 'crypto';
import { createProgress, updateProgress, completeProgress, failProgress } from '../progress';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  format: z.enum(['mp3', 'wav', 'aac', 'ogg']).default('mp3'),
  quality: z.number().int().min(1).max(100).default(80),
});

const tool: Tool = {
  name: 'video-to-audio',
  description: 'Extract audio from video file',
  category: 'video',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, format, quality } = inputSchema.parse(input);

    const tmpDirPath = createTempDir();
    const inputPath = join(tmpDirPath, `input-${randomUUID()}.mp4`);
    const outputPath = join(tmpDirPath, `output-${randomUUID()}.${format}`);

    try {
      await writeFile(inputPath, file);

      const progressId = randomBytes(8).toString('hex');
      createProgress(progressId, 'video-to-audio');

      await new Promise<void>((resolve, reject) => {
        const TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟超时
        const command = ffmpeg(inputPath)
          .noVideo()
          .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'aac' ? 'aac' : 'libvorbis')
          .audioBitrate(`${Math.round(quality * 3.2)}k`) // Map 1-100 to 32-320kbps
          .format(format)
          .output(outputPath)
          .on('progress', (p) => {
            updateProgress(progressId, Math.round(p.percent || 0), `Processing: ${(p.percent || 0).toFixed(1)}%`);
          })
          .on('end', () => { clearTimeout(timer); completeProgress(progressId); resolve(); })
          .on('error', (err) => { clearTimeout(timer); failProgress(progressId, err.message); reject(new Error(err.message)); });

        const timer = setTimeout(() => {
          command.kill('SIGKILL');
          reject(new Error('音频提取超时（5分钟限制）'));
        }, TIMEOUT_MS);

        command.run();
      });

      const outputBuffer = await readFile(outputPath);

      // Cleanup
      cleanTempDir(tmpDirPath);

      const mimeTypes: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        aac: 'audio/aac',
        ogg: 'audio/ogg',
      };

      return {
        data: outputBuffer,
        mimeType: mimeTypes[format],
        filename: `audio.${format}`,
        progressId,
      };
    } catch (e) {
      // Cleanup on error
      cleanTempDir(tmpDirPath);
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to extract audio: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
