import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  mode: z.enum(['to-date', 'from-date']).default('to-date'),
  value: z.union([z.number(), z.string()]).optional(),
  text: z.string().optional(),
  format: z.enum(['iso', 'locale', 'unix']).default('iso'),
});

const tool: Tool = {
  name: 'timestamp',
  description: 'Convert between Unix timestamps and dates',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { mode, value, text, format } = inputSchema.parse(input);
    const inputValue = value ?? text;

    if (!inputValue) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Value is required');
    }

    try {
      if (mode === 'to-date') {
        // Unix timestamp to date
        const timestamp = typeof inputValue === 'string' ? parseInt(inputValue as string, 10) : inputValue as number;

        if (isNaN(timestamp)) {
          throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid timestamp value');
        }

        const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

        let result: string;
        switch (format) {
          case 'iso':
            result = date.toISOString();
            break;
          case 'locale':
            result = date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            break;
          case 'unix':
            result = Math.floor(date.getTime() / 1000).toString();
            break;
        }

        return {
          text: JSON.stringify({
            timestamp,
            date: result,
            format,
          }, null, 2),
        };
      } else {
        // Date to Unix timestamp
        const dateStr = inputValue.toString();
        const date = new Date(dateStr);

        if (isNaN(date.getTime())) {
          throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid date string');
        }

        const timestamp = Math.floor(date.getTime() / 1000);

        return {
          text: JSON.stringify({
            input: dateStr,
            timestamp,
            iso: date.toISOString(),
          }, null, 2),
        };
      }
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Conversion failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
