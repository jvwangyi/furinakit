import { z } from 'zod';
import ffmpeg from 'fluent-ffmpeg';
import { createTempDir, cleanTempDir } from '../tmp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const inputSchema = z.object({
  mode: z.enum(['images-to-gif', 'video-to-gif']),
  files: z.array(z.instanceof(Buffer)).min(1),
  mimeTypes: z.array(z.string()).default([]),
  fps: z.number().int().min(1).max(30).default(10),
  width: z.number().int().min(50).max(800).default(320),
  loop: z.number().int().min(0).max(100).default(0), // 0 = infinite
  startTime: z.string().default('00:00:00'), // for video-to-gif
  duration: z.number().min(0.1).max(30).default(5), // seconds for video-to-gif
});

const tool: Tool = {
  name: 'gif-maker',
  description: 'Create GIF from images or convert video to GIF',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { mode, files, mimeTypes, fps, width, loop, startTime, duration } = inputSchema.parse(input);

    const tmpDirPath = createTempDir();
    const id = randomUUID();

    try {
      const outputPath = join(tmpDirPath, `output-${id}.gif`);

      if (mode === 'images-to-gif') {
        // Save each image and convert to PNG for consistent format
        for (let i = 0; i < files.length; i++) {
          const ext = (mimeTypes[i] || 'image/png').split('/')[1] || 'png';
          const imgPath = join(tmpDirPath, `frame-${String(i).padStart(4, '0')}.${ext}`);
          await writeFile(imgPath, files[i]);

          if (ext !== 'png') {
            const pngPath = join(tmpDirPath, `frame-${String(i).padStart(4, '0')}.png`);
            await new Promise<void>((resolve, reject) => {
              ffmpeg(imgPath)
                .output(pngPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(new Error(err.message)))
                .run();
            });
          }
        }

        const framePattern = join(tmpDirPath, 'frame-%04d.png');

        await new Promise<void>((resolve, reject) => {
          const TIMEOUT_MS = 60 * 1000;
          const command = ffmpeg(framePattern)
            .inputOptions(['-framerate', fps.toString()])
            .outputOptions([
              '-vf', `scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
              '-loop', loop.toString(),
            ]);

          const timer = setTimeout(() => {
            command.kill('SIGKILL');
            reject(new Error('GIF creation timeout'));
          }, TIMEOUT_MS);

          command
            .output(outputPath)
            .on('end', () => { clearTimeout(timer); resolve(); })
            .on('error', (err) => { clearTimeout(timer); reject(new Error(err.message)); })
            .run();
        });
      } else {
        // video-to-gif
        const videoPath = join(tmpDirPath, `input-${id}.mp4`);
        await writeFile(videoPath, files[0]);

        await new Promise<void>((resolve, reject) => {
          const TIMEOUT_MS = 60 * 1000;
          const command = ffmpeg(videoPath)
            .seekInput(startTime)
            .duration(duration)
            .outputOptions([
              '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
              '-loop', loop.toString(),
            ]);

          const timer = setTimeout(() => {
            command.kill('SIGKILL');
            reject(new Error('GIF creation timeout'));
          }, TIMEOUT_MS);

          command
            .output(outputPath)
            .on('end', () => { clearTimeout(timer); resolve(); })
            .on('error', (err) => { clearTimeout(timer); reject(new Error(err.message)); })
            .run();
        });
      }

      const resultBuffer = await readFile(outputPath);

      cleanTempDir(tmpDirPath);

      return {
        data: resultBuffer,
        mimeType: 'image/gif',
        filename: `furinakit_${mode}_${id}.gif`,
      };
    } catch (e) {
      cleanTempDir(tmpDirPath);
      throw new ToolError(ErrorCode.PROCESS_FAILED, `GIF creation failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
