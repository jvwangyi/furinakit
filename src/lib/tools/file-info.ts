import { z } from 'zod';
import { createHash } from 'crypto';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  file: z.string(), // Base64 encoded file
  filename: z.string(),
});

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    zip: 'application/zip',
    json: 'application/json',
    txt: 'text/plain',
    csv: 'text/csv',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ts: 'application/typescript',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

const tool: Tool = {
  name: 'file-info',
  description: 'Get file metadata including size, type, and hash values',
  category: 'file',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, filename } = inputSchema.parse(input);

    try {
      const buffer = Buffer.from(file, 'base64');
      const size = buffer.length;

      // Calculate hashes
      const md5 = createHash('md5').update(buffer).digest('hex');
      const sha256 = createHash('sha256').update(buffer).digest('hex');

      // Format size
      let sizeFormatted: string;
      if (size < 1024) {
        sizeFormatted = `${size} B`;
      } else if (size < 1024 * 1024) {
        sizeFormatted = `${(size / 1024).toFixed(2)} KB`;
      } else if (size < 1024 * 1024 * 1024) {
        sizeFormatted = `${(size / (1024 * 1024)).toFixed(2)} MB`;
      } else {
        sizeFormatted = `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      }

      return {
        text: JSON.stringify({
          name: filename,
          size,
          sizeFormatted,
          mimeType: getMimeType(filename),
          md5,
          sha256,
        }, null, 2),
      };
    } catch (e) {
      throw new Error(`Failed to analyze file: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
