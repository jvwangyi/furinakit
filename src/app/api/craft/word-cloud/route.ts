import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('word-cloud', { validate: true, bufferResponse: false });
