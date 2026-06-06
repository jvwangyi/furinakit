import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, ToolError, ErrorCode } from './errors';
import { captureError } from './error-monitor';
import { getTool } from './registry';
import { extractApiKey, defaultLimiter, apiKeyLimiter } from './rate-limit';
import { validateApiKey } from './api-key';
import { recordToolUsage } from './tool-stats';
import { validateFileType, sanitizeFilename, withCategoryTimeout } from './file-security';
import { getSessionUser } from './auth-helpers';
import { prisma } from './prisma';
import type { Tool } from '../types/tool';

// Ensure all tools are registered when any route uses createToolRoute
import './tools';

/** File size limits by category (bytes) */
export const MAX_FILE_SIZE: Record<string, number> = {
  image: 20 * 1024 * 1024,    // 20 MB
  pdf: 50 * 1024 * 1024,      // 50 MB
  video: 200 * 1024 * 1024,   // 200 MB
  audio: 200 * 1024 * 1024,   // 200 MB
  default: 50 * 1024 * 1024,  // 50 MB
};

/** Check if a buffer exceeds the size limit for a given category */
export function checkFileSize(buffer: Buffer, category?: string): void {
  const limit = MAX_FILE_SIZE[category || 'default'] || MAX_FILE_SIZE.default;
  if (buffer.length > limit) {
    const limitMB = Math.round(limit / (1024 * 1024));
    throw new ToolError(ErrorCode.FILE_TOO_LARGE, `File too large (max ${limitMB}MB)`);
  }
}

export async function parseJsonInput(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid JSON body');
  }
}

export async function parseFormDataInput(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result: Record<string, any> = {};
    const fileCounts: Record<string, number> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        const buf = Buffer.from(arrayBuffer);
        checkFileSize(buf);
        validateFileType(buf, 'default', value.name);
        fileCounts[key] = (fileCounts[key] || 0) + 1;
        if (fileCounts[key] > 1) {
          if (!Array.isArray(result[key])) result[key] = [result[key]];
          result[key].push(buf);
        } else {
          result[key] = buf;
        }
      } else {
        // Try to parse JSON values
        try {
          result[key] = JSON.parse(value as string);
        } catch {
          result[key] = value;
        }
      }
    }

    return result;
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid form data');
  }
}

export async function parseInput(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  
  if (contentType.includes('multipart/form-data')) {
    return parseFormDataInput(req);
  }
  
  return parseJsonInput(req);
}

/**
 * Validate input against a tool's zod schema.
 * Call this before tool.execute() in API routes.
 */
export function validateToolInput(tool: Tool, input: unknown) {
  return tool.inputSchema.parse(input);
}

export function bufferToResponse(buffer: Buffer, mimeType: string, filename: string) {
  // RFC 5987: encode non-ASCII filenames
  const isAscii = /^[\x20-\x7E]+$/.test(filename);
  const disposition = isAscii
    ? `attachment; filename="${filename}"`
    : `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': disposition,
    },
  });
}

export async function parseFormDataFile(req: NextRequest): Promise<{ file: Buffer; fields: Record<string, any> }> {
  try {
    const formData = await req.formData();
    let file: Buffer | null = null;
    const fields: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        file = Buffer.from(arrayBuffer);
        checkFileSize(file);
        validateFileType(file, 'default', value.name);
      } else {
        // Try to parse JSON values
        try {
          fields[key] = JSON.parse(value as string);
        } catch {
          fields[key] = value;
        }
      }
    }

    if (!file) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'File is required');
    }

    return { file, fields };
  } catch (e) {
    if (e instanceof ToolError) throw e;
    throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid form data');
  }
}

type FieldTransform = (value: any, fields: Record<string, any>) => any;

interface CreateToolRouteOptions {
  /** If true, parse as multipart form data + JSON; if false (default), parse JSON only */
  parseForm?: boolean;
  /** If true, use parseFormDataFile to extract file + fields separately (default: false) */
  parseFile?: boolean;
  /** If true, validate input against tool's zod schema (default: false) */
  validate?: boolean;
  /** If true, return buffer response when result has data (default: true) */
  bufferResponse?: boolean;
  /** Field transforms applied after parsing (only with parseFile). Keys are field names, values are transform functions. */
  fieldTransforms?: Record<string, FieldTransform>;
  /** Optional custom validation after field transforms. Throw ToolError on failure. */
  validateInput?: (input: Record<string, any>) => void;
}

/**
 * Factory to create a standard POST handler for tool API routes.
 *
 * Covers three common patterns:
 * - Simple JSON: parseJsonInput → tool.execute → JSON response
 * - Validated form: parseInput → validateToolInput → tool.execute → buffer or JSON response
 * - File + fields: parseFormDataFile → fieldTransforms → tool.execute → buffer response
 */
export function createToolRoute(
  toolName: string,
  options: CreateToolRouteOptions = {}
) {
  const {
    parseForm = false,
    parseFile = false,
    validate = false,
    bufferResponse = true,
    fieldTransforms,
    validateInput,
  } = options;

  return async function POST(req: NextRequest) {
    try {
      // Rate limit check — API key users get 300/min, others get 60/min
      const apiKeyValue = extractApiKey(req);
      let isApiKeyAuth = false;

      if (apiKeyValue) {
        const validKey = validateApiKey(apiKeyValue);
        if (validKey) {
          isApiKeyAuth = true;
        }
      }

      const limiter = isApiKeyAuth ? apiKeyLimiter : defaultLimiter;
      const limitMax = isApiKeyAuth ? '300' : '60';
      const { allowed, remaining, resetTime } = limiter.check(req);
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limitMax,
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toString(),
              'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      const tool = getTool(toolName);
      if (!tool) throw new ToolError(ErrorCode.TOOL_NOT_FOUND, 'Tool not found');

      let input: Record<string, any>;

      if (parseFile) {
        const { file, fields } = await parseFormDataFile(req);
        const transformed: Record<string, any> = { file };
        for (const [key, value] of Object.entries(fields)) {
          transformed[key] = fieldTransforms?.[key]
            ? fieldTransforms[key](value, fields)
            : value;
        }
        input = transformed;
      } else {
        input = parseForm ? await parseInput(req) : await parseJsonInput(req);
      }

      if (validateInput) validateInput(input);
      if (validate) validateToolInput(tool, input);

      // Apply timeout based on tool category
      const category = tool.category || 'default';
      const result = await withCategoryTimeout(tool.execute(input), category);

      // Record tool usage stats (in-memory)
      recordToolUsage(toolName);

      // Record to database if user is logged in (fire-and-forget)
      getSessionUser(req).then(user => {
        if (user) {
          prisma.toolUsageHistory.create({ data: { userId: user.id, toolName } }).catch(() => {});
        }
      }).catch(() => {});

      if (bufferResponse && result.data && !result.text) {
        return bufferToResponse(
          result.data as Buffer,
          result.mimeType || 'application/octet-stream',
          result.filename || 'output'
        );
      }

      return Response.json({ success: true, data: result });
    } catch (error) {
      captureError({
        toolName,
        error: (error as Error).message || 'Unknown error',
        stack: (error as Error).stack,
        severity: 'medium',
      });
      return errorResponse(error as Error);
    }
  };
}
