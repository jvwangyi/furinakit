import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('pdf-compress', {
  parseFile: true,
  fieldTransforms: {
    quality: (v) => v || 'medium',
  },
});
