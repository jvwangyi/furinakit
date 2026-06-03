import { z } from 'zod';
import { format } from 'sql-formatter';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string().min(1, 'SQL is required'),
  language: z.enum(['sql', 'mysql', 'postgresql', 'sqlite', 'bigquery', 'tsql', 'plsql']).default('sql'),
  indent: z.enum(['1', '2', '4', 'tab']).default('2'),
});

const tool: Tool = {
  name: 'sql-format',
  description: 'Format SQL queries',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, language, indent } = inputSchema.parse(input);

    try {
      const indentStr = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent));
      const formatted = format(text, {
        language,
        tabWidth: parseInt(indent),
        useTabs: indent === 'tab',
      });

      return {
        text: formatted,
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Failed to format SQL: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
