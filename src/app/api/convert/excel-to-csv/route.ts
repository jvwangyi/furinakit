import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('excel-to-csv', {
  parseFile: true,
  fieldTransforms: {
    sheetIndex: (v) => (v !== undefined ? parseInt(v as string, 10) : 0),
    delimiter: (v) => v || ',',
  },
});
