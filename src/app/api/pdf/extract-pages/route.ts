import { createToolRoute } from '@/lib/api-utils';
import { ToolError, ErrorCode } from '@/lib/errors';

export const POST = createToolRoute('pdf-extract-pages', {
  parseFile: true,
  fieldTransforms: {
    pages: (v) => Array.isArray(v) ? v : (v ? JSON.parse(v as string) : []),
  },
  validateInput: (input) => {
    if (!Array.isArray(input.pages) || input.pages.length === 0) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Pages array is required');
    }
  },
});
