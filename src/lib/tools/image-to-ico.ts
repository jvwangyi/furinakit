import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  size: z.number().min(16).max(256).default(64),
});

const tool: Tool = {
  name: 'image-to-ico',
  description: 'Convert image to ICO format (favicon)',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, size } = inputSchema.parse(input);

    try {
      // Convert image to PNG buffer at specified size
      const pngBuffer = await sharp(file)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      // Create ICO file
      // ICO format: header + directory entry + bitmap data
      const header = Buffer.alloc(6);
      header.writeUInt16LE(0, 0);      // Reserved
      header.writeUInt16LE(1, 2);      // Type: ICO
      header.writeUInt16LE(1, 4);      // Number of images

      const directory = Buffer.alloc(16);
      directory.writeUInt8(size, 0);           // Width
      directory.writeUInt8(size, 1);           // Height
      directory.writeUInt8(0, 2);              // Color palette
      directory.writeUInt8(0, 3);              // Reserved
      directory.writeUInt16LE(1, 4);           // Color planes
      directory.writeUInt16LE(32, 6);          // Bits per pixel
      directory.writeUInt32LE(pngBuffer.length, 8);  // Image data size
      directory.writeUInt32LE(22, 12);         // Image data offset (6 + 16 = 22)

      const icoBuffer = Buffer.concat([header, directory, pngBuffer]);

      return {
        data: icoBuffer,
        mimeType: 'image/x-icon',
        filename: 'favicon.ico',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to convert to ICO: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
