import { createToolRoute } from '@/lib/api-utils';

export const POST = createToolRoute('qrcode-gen', { bufferResponse: false });
