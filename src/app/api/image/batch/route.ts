/**
 * Batch image processing — submit multiple image operations as a queue batch.
 *
 * POST /api/image/batch
 *   Accepts multipart form data with multiple files and operation config.
 *   Returns a batchId for progress tracking via GET /api/queue?batchId=...
 *
 * Supported operations: compress, resize, rotate, convert
 */

import { NextRequest } from 'next/server';
import { getQueue } from '@/lib/queue';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { checkFileSize } from '@/lib/api-utils';
import { validateFileType } from '@/lib/file-security';

// Ensure tools are registered
import '@/lib/tools';

interface BatchImageRequest {
  operation: 'compress' | 'resize' | 'rotate' | 'convert';
  files: Buffer[];
  filenames: string[];
  options: Record<string, unknown>;
}

type ImageOperation = 'compress' | 'resize' | 'rotate' | 'convert';

async function parseBatchInput(req: NextRequest): Promise<BatchImageRequest> {
  const formData = await req.formData();
  const files: Buffer[] = [];
  const filenames: string[] = [];
  let operation: ImageOperation = 'compress';
  const options: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const arrayBuffer = await value.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      checkFileSize(buf, 'image');
      validateFileType(buf, 'image', value.name);
      files.push(buf);
      filenames.push(value.name);
    } else if (key === 'operation') {
      const val = value as string;
      const validOps: ImageOperation[] = ['compress', 'resize', 'rotate', 'convert'];
      if (validOps.includes(val as ImageOperation)) {
        operation = val as ImageOperation;
      }
    } else {
      try {
        options[key] = JSON.parse(value as string);
      } catch {
        options[key] = value;
      }
    }
  }

  if (files.length === 0) {
    throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least one image file is required');
  }

  if (files.length > 50) {
    throw new ToolError(ErrorCode.INVALID_INPUT, 'Maximum 50 files per batch');
  }

  const validOps = ['compress', 'resize', 'rotate', 'convert'];
  if (!validOps.includes(operation)) {
    throw new ToolError(ErrorCode.INVALID_INPUT, `operation must be one of: ${validOps.join(', ')}`);
  }

  return { operation, files, filenames, options };
}

function operationToToolName(operation: string): string {
  const map: Record<string, string> = {
    compress: 'image-compress',
    resize: 'image-resize',
    rotate: 'image-rotate',
    convert: 'image-convert',
  };
  return map[operation] || operation;
}

export async function POST(req: NextRequest) {
  try {
    const { operation, files, filenames, options } = await parseBatchInput(req);
    const toolName = operationToToolName(operation);

    // Apply field transforms for specific operations
    const transformedOptions = { ...options };
    if (operation === 'compress' && transformedOptions.quality) {
      transformedOptions.quality = parseInt(String(transformedOptions.quality), 10) || 80;
    }

    const queue = getQueue();

    const tasks = files.map((file, i) => ({
      toolName,
      input: { file, ...transformedOptions },
      label: `${operation}: ${filenames[i]}`,
      priority: 'normal' as const,
    }));

    const { batchId, taskIds } = queue.enqueueBatch(tasks);

    return Response.json({
      success: true,
      data: {
        batchId,
        operation,
        fileCount: files.length,
        taskIds,
        statusUrl: `/api/queue?batchId=${batchId}`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
