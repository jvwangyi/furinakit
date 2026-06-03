import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-compress', {
  parseFile: true,
  fieldTransforms: {
    quality: (v) => (v ? parseInt(v as string, 10) : 80),
    format: (v) => v || undefined,
  },
});
