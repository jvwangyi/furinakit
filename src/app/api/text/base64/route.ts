import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('base64', { parseForm: true, validate: true });
