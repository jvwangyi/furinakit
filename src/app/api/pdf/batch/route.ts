/**
 * Batch PDF processing — submit multiple PDF operations as a queue batch.
 *
 * POST /api/pdf/batch
 *   Accepts multipart form data with multiple files and operation config.
 *   Returns a batchId for progress tracking via GET /api/queue?batchId=...
 *
 * Supported operations: compress, rotate, encrypt, watermark
 */

import { NextRequest } from 'next/server';
import { getQueue } from '@/lib/queue';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';
import { checkFileSize } from '@/lib/api-utils';
import { validateFileType } from '@/lib/file-security';

// Ensure tools are registered
import '@/lib/tools';

interface BatchPdfRequest {
  operation: 'compress' | 'rotate' | 'encrypt' | 'watermark';
  files: Buffer[];
  filenames: string[];
  options: Record<string, unknown>;
}

type PdfOperation = 'compress' | 'rotate' | 'encrypt' | 'watermark';

async function parseBatchInput(req: NextRequest): Promise<BatchPdfRequest> {
  const formData = await req.formData();
  const files: Buffer[] = [];
  const filenames: string[] = [];
  let operation: PdfOperation = 'compress';
  const options: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      const arrayBuffer = await value.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      checkFileSize(buf, 'pdf');
      validateFileType(buf, 'pdf', value.name);
      files.push(buf);
      filenames.push(value.name);
    } else if (key === 'operation') {
      const val = value as string;
      const validOps: PdfOperation[] = ['compress', 'rotate', 'encrypt', 'watermark'];
      if (validOps.includes(val as PdfOperation)) {
        operation = val as PdfOperation;
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
    throw new ToolError(ErrorCode.MISSING_REQUIRED, 'At least one PDF file is required');
  }

  if (files.length > 20) {
    throw new ToolError(ErrorCode.INVALID_INPUT, 'Maximum 20 files per batch');
  }

  const validOps = ['compress', 'rotate', 'encrypt', 'watermark'];
  if (!validOps.includes(operation)) {
    throw new ToolError(ErrorCode.INVALID_INPUT, `operation must be one of: ${validOps.join(', ')}`);
  }

  return { operation, files, filenames, options };
}

function operationToToolName(operation: string): string {
  const map: Record<string, string> = {
    compress: 'pdf-compress',
    rotate: 'pdf-rotate',
    encrypt: 'pdf-encrypt',
    watermark: 'pdf-watermark',
  };
  return map[operation] || operation;
}

export async function POST(req: NextRequest) {
  try {
    const { operation, files, filenames, options } = await parseBatchInput(req);
    const toolName = operationToToolName(operation);

    const queue = getQueue();

    const tasks = files.map((file, i) => ({
      toolName,
      input: { file, ...options },
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
