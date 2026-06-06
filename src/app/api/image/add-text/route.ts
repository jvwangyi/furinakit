import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseFormDataFile } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('image-add-text');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const { file, fields } = await parseFormDataFile(req);

    if (!fields.text) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Text is required');
    }

    const result = await tool.execute({
      file,
      text: fields.text as string,
      fontSize: fields.fontSize ? parseInt(fields.fontSize as string) : 48,
      color: (fields.color as string) || '#ffffff',
      x: fields.x ? parseFloat(fields.x as string) : 50,
      y: fields.y ? parseFloat(fields.y as string) : 50,
      rotation: fields.rotation ? parseFloat(fields.rotation as string) : 0,
      fontFamily: (fields.fontFamily as string) || 'sans-serif',
      fontWeight: (fields.fontWeight as string) || 'bold',
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'image/png',
        'Content-Disposition': `attachment; filename="${result.filename || 'text-overlay.png'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
