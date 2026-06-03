import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-to-base64', {
  parseFile: true,
  fieldTransforms: {
    outputFormat: (v) => v || undefined,
    addDataUri: (v) => (v === undefined ? true : v !== 'false'),
  },
});
