import { z } from 'zod';
import Papa from 'papaparse';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  delimiter: z.string().default(','),
  header: z.boolean().default(true),
});

const tool: Tool = {
  name: 'json-to-csv',
  description: 'Convert JSON array to CSV format',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, delimiter, header } = inputSchema.parse(input);

    try {
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'Input must be a JSON array');
      }

      if (parsed.length === 0) {
        return { text: '' };
      }

      const csv = Papa.unparse(parsed, {
        delimiter,
        header,
      });

      return { text: csv };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid JSON: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
