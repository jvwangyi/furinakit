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
  name: 'csv-to-json',
  description: 'Convert CSV to JSON array',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, delimiter, header } = inputSchema.parse(input);

    try {
      const result = Papa.parse(text, {
        delimiter,
        header,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (result.errors.length > 0) {
        const errorMsg = result.errors.map(e => e.message).join(', ');
        throw new ToolError(ErrorCode.INVALID_INPUT, `CSV parse errors: ${errorMsg}`);
      }

      const json = JSON.stringify(result.data, null, 2);

      return { text: json };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `CSV parse failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
