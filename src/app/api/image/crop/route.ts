import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('image-crop', { parseForm: true, validate: true });
