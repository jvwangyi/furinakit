import { z } from 'zod';
import YAML from 'yaml';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  indent: z.number().min(1).max(10).default(2),
});

const tool: Tool = {
  name: 'json-to-yaml',
  description: 'Convert JSON to YAML format',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, indent } = inputSchema.parse(input);

    try {
      const parsed = JSON.parse(text);
      const yaml = YAML.stringify(parsed, {
        indent,
      });

      return { text: yaml };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid JSON: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
