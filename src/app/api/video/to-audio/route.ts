import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseFormDataFile } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('video-to-audio');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const { file, fields } = await parseFormDataFile(req);
    const result = await tool.execute({
      file,
      format: (fields.format as string) || 'mp3',
      quality: fields.quality ? parseInt(fields.quality as string) : 80,
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${result.filename || 'audio.mp3'}"`,
        ...(result.progressId ? { 'X-Progress-Id': result.progressId } : {}),
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
