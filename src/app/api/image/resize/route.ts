import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-resize', { parseForm: true, validate: true });
