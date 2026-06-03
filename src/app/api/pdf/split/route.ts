import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('pdf-split', {
  parseFile: true,
  fieldTransforms: {
    pages: (v) => Array.isArray(v) ? v : (v ? JSON.parse(v as string) : undefined),
    ranges: (v) => Array.isArray(v) ? v : (v ? JSON.parse(v as string) : undefined),
  },
});
