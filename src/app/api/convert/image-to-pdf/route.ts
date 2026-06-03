import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('image-to-pdf');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const formData = await req.formData();
    const files: Buffer[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof Blob) {
        const arrayBuffer = await value.arrayBuffer();
        files.push(Buffer.from(arrayBuffer));
      }
    }

    if (files.length < 1) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least 1 image required');
    }

    const pageSize = (formData.get('pageSize') as string) || 'A4';

    const result = await tool.execute({
      files,
      pageSize: pageSize as 'A4' | 'Letter' | 'fit',
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename || 'converted.pdf'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
