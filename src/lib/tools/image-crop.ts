import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  left: z.number().min(0),
  top: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  format: z.enum(['jpeg', 'png', 'webp', 'avif']).optional(),
});

const tool: Tool = {
  name: 'image-crop',
  description: 'Crop an image to a specific region',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, left, top, width, height, format } = inputSchema.parse(input);
    
    const image = sharp(file);
    const metadata = await image.metadata();
    
    const cropped = image.extract({ left, top, width, height });
    
    const outputFormat = format || metadata.format || 'png';
    const buffer = await cropped.toFormat(outputFormat as any).toBuffer();
    
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
    };
    
    return {
      data: buffer,
      mimeType: mimeTypes[outputFormat] || 'image/png',
      filename: `cropped.${outputFormat}`,
    };
  },
};

register(tool);
export default tool;
