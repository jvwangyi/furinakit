import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { parseFormDataFile } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('pdf-encrypt');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const { file, fields } = await parseFormDataFile(req);
    const result = await tool.execute({
      file,
      password: fields.password,
      ownerPassword: fields.ownerPassword,
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename || 'encrypted.pdf'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
