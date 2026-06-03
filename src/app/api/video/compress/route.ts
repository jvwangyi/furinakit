import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseFormDataFile } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('video-compress');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const { file, fields } = await parseFormDataFile(req);
    const result = await tool.execute({
      file,
      quality: (fields.quality as string) || 'medium',
      maxWidth: fields.maxWidth ? parseInt(fields.maxWidth as string) : undefined,
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${result.filename || 'compressed.mp4'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
