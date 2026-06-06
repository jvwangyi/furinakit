import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseFormDataFile } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('video-trim');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const { file, fields } = await parseFormDataFile(req);

    if (!fields.startTime) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'startTime is required');
    }

    const result = await tool.execute({
      file,
      startTime: fields.startTime as string,
      endTime: fields.endTime as string,
      duration: fields.duration as string,
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'video/mp4',
        'Content-Disposition': `attachment; filename="${result.filename || 'trimmed.mp4'}"`,
        ...(result.progressId ? { 'X-Progress-Id': result.progressId } : {}),
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
