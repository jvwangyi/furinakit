import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-to-ico', {
  parseFile: true,
  fieldTransforms: {
    size: (v) => (v ? parseInt(v as string, 10) : 64),
  },
});
