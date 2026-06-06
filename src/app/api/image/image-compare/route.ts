import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseInput, validateToolInput } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('image-compare');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const input = await parseInput(req);
    validateToolInput(tool, input);
    const result = await tool.execute(input);

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${result.filename || 'compare.jpg'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
