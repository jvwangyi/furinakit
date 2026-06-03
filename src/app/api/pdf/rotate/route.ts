import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('pdf-rotate', {
  parseFile: true,
  fieldTransforms: {
    rotation: (v) => (v ? parseInt(v as string, 10) : 90),
    pages: (v) => Array.isArray(v) ? v : (v ? JSON.parse(v as string) : undefined),
  },
});
