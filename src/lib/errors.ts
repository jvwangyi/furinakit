export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED = 'MISSING_REQUIRED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  PROCESS_FAILED = 'PROCESS_FAILED',
  TIMEOUT = 'TIMEOUT',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
}

export class ToolError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export function errorResponse(error: ToolError | Error) {
  if (error instanceof ToolError) {
    return Response.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  return Response.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
    { status: 500 }
  );
}
