import { NextRequest } from 'next/server';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const tool = getTool('image-merge');
    if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

    const formData = await req.formData();
    const files: Buffer[] = [];

    // Get all image files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof Blob) {
        const arrayBuffer = await value.arrayBuffer();
        files.push(Buffer.from(arrayBuffer));
      }
    }

    if (files.length < 2) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least 2 images required');
    }

    const direction = formData.get('direction') as string || 'horizontal';
    const background = formData.get('background') as string || '#ffffff';

    const result = await tool.execute({
      files,
      direction: direction as 'horizontal' | 'vertical',
      background,
    });

    return new Response(Buffer.from(result.data as Buffer), {
      headers: {
        'Content-Type': result.mimeType || 'image/png',
        'Content-Disposition': `attachment; filename="${result.filename || 'merged.png'}"`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
