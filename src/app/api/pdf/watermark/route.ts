import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseFormDataFile } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('pdf-watermark');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const { file, fields } = await parseFormDataFile(req);
    const result = await tool.execute({
      file,
      text: fields.text || 'WATERMARK',
      fontSize: fields.fontSize ? parseInt(fields.fontSize) : 50,
      opacity: fields.opacity ? parseFloat(fields.opacity) : 0.3,
      color: fields.color || '#888888',
      position: fields.position || 'center',
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename || 'watermarked.pdf'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
