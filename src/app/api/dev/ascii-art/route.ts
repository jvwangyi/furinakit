import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('ascii-art', { validate: true, bufferResponse: false });
