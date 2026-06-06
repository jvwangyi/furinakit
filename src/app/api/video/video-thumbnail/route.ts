import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('video-thumbnail', {
  parseFile: true,
  fieldTransforms: {
    timestamp: (v) => v || '00:00:01',
    width: (v) => (v ? parseInt(v as string, 10) : 640),
    format: (v) => v || 'jpg',
    quality: (v) => (v ? parseInt(v as string, 10) : 80),
  },
});
