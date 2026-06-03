import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseInput, bufferToResponse, validateToolInput } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('pdf-merge');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');
    
    const input = await parseInput(req);
    
    // Handle multiple files from form data
    if (input.files && Array.isArray(input.files)) {
      input.files = input.files.map((f: Buffer | ArrayBuffer) => 
        Buffer.isBuffer(f) ? f : Buffer.from(f)
      );
    }
    
    validateToolInput(tool, input);
    const result = await tool.execute(input);
    
    if (result.data) {
      return bufferToResponse(
        result.data as Buffer,
        result.mimeType || 'application/octet-stream',
        result.filename || 'output'
      );
    }
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
