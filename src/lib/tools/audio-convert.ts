import { z } from 'zod';
import ffmpeg from 'fluent-ffmpeg';
import { createTempDir, cleanTempDir } from '../tmp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID, randomBytes } from 'crypto';
import { createProgress, updateProgress, completeProgress, failProgress } from '../progress';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  format: z.enum(['mp3', 'wav', 'aac', 'ogg', 'flac']).default('mp3'),
  quality: z.number().int().min(1).max(100).default(80),
});

const tool: Tool = {
  name: 'audio-convert',
  description: 'Convert audio between formats (mp3/wav/aac/ogg/flac)',
  category: 'audio',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, format, quality } = inputSchema.parse(input);

    const tmpDirPath = createTempDir();
    const inputPath = join(tmpDirPath, `input-${randomUUID()}.tmp`);
    const outputPath = join(tmpDirPath, `output-${randomUUID()}.${format}`);

    try {
      await writeFile(inputPath, file);

      const progressId = randomBytes(8).toString('hex');
      createProgress(progressId, 'audio-convert');

      await new Promise<void>((resolve, reject) => {
        const TIMEOUT_MS = 5 * 60 * 1000;

        const audioCodecMap: Record<string, string> = {
          mp3: 'libmp3lame',
          wav: 'pcm_s16le',
          aac: 'aac',
          ogg: 'libvorbis',
          flac: 'flac',
        };

        // ffmpeg format names differ from file extensions
        const outputFormatMap: Record<string, string> = {
          mp3: 'mp3',
          wav: 'wav',
          aac: 'adts',
          ogg: 'ogg',
          flac: 'flac',
        };

        const outputFormat = outputFormatMap[format] || format;

        let command = ffmpeg(inputPath)
          .audioCodec(audioCodecMap[format]);

        // vorbis uses quality scale (0-10), not bitrate
        if (format === 'ogg') {
          command = command.audioQuality(Math.round(quality / 10));
        } else {
          command = command.audioBitrate(`${Math.round(quality * 3.2)}k`);
        }

        command
          .format(outputFormat)
          .output(outputPath)
          .on('progress', (p) => {
            updateProgress(progressId, Math.round(p.percent || 0), `Processing: ${(p.percent || 0).toFixed(1)}%`);
          })
          .on('end', () => { clearTimeout(timer); completeProgress(progressId); resolve(); })
          .on('error', (err) => { clearTimeout(timer); failProgress(progressId, err.message); reject(new Error(err.message)); });

        const timer = setTimeout(() => {
          command.kill('SIGKILL');
          reject(new Error('音频转换超时（5分钟限制）'));
        }, TIMEOUT_MS);

        command.run();
      });

      const outputBuffer = await readFile(outputPath);

      cleanTempDir(tmpDirPath);

      const mimeTypes: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        aac: 'audio/aac',
        ogg: 'audio/ogg',
        flac: 'audio/flac',
      };

      return {
        data: outputBuffer,
        mimeType: mimeTypes[format],
        filename: `audio.${format}`,
        progressId,
      };
    } catch (e) {
      cleanTempDir(tmpDirPath);
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert audio: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
