import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-convert', { parseForm: true, validate: true });
