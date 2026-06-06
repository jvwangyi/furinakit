import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-resize', {
  parseForm: true,
  validate: true,
  validateInput: (input) => {
    // Normalize: if multiple files uploaded with key "file", move to "files"
    if (Array.isArray(input.file)) {
      input.files = input.file;
      delete input.file;
    }
  },
});
