import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('sql-format', { parseForm: true, validate: true });
