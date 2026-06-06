import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-rotate', {
  parseForm: true,
  validate: true,
  validateInput: (input) => {
    // Normalize: if multiple files uploaded with key "file", move to "files"
    if (Array.isArray(input.file)) {
      input.files = input.file;
      delete input.file;
    }
    // Apply field transforms (previously handled by parseFile + fieldTransforms)
    if (input.angle !== undefined) input.angle = parseInt(String(input.angle), 10) || 0;
    if (!input.background) input.background = '#00000000';
    if (!input.flip) input.flip = 'none';
  },
});
