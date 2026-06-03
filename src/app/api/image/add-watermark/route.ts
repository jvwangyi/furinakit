import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseFormDataFile } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('image-add-watermark');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const { file, fields } = await parseFormDataFile(req);

    if (!fields.text) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Watermark text is required');
    }

    const result = await tool.execute({
      file,
      text: fields.text as string,
      position: (fields.position as string) || 'bottom-right',
      opacity: fields.opacity ? parseFloat(fields.opacity as string) : 0.5,
      fontSize: fields.fontSize ? parseInt(fields.fontSize as string) : 48,
      color: (fields.color as string) || '#ffffff',
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'image/png',
        'Content-Disposition': `attachment; filename="${result.filename || 'watermarked.png'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
