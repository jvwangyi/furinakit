import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('hash', { parseForm: true, validate: true });
