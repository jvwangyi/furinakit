import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('pdf-to-image', {
  parseFile: true,
  fieldTransforms: {
    page: (v) => (v ? parseInt(v as string, 10) : 1),
    format: (v) => v || 'png',
    scale: (v) => (v ? parseFloat(v as string) : 1),
  },
});
