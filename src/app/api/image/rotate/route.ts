import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-rotate', {
  parseFile: true,
  fieldTransforms: {
    angle: (v) => (v ? parseInt(v as string, 10) : 90),
    background: (v) => v || '#00000000',
    flip: (v) => v || 'none',
  },
});
