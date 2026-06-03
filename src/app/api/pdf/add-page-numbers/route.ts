import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('pdf-add-page-numbers', {
  parseFile: true,
  fieldTransforms: {
    position: (v) => v || 'bottom-center',
    fontSize: (v) => (v ? parseInt(v as string, 10) : 12),
  },
});
