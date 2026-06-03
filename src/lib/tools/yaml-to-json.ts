import { z } from 'zod';
import YAML from 'yaml';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  indent: z.number().min(0).max(10).default(2),
});

const tool: Tool = {
  name: 'yaml-to-json',
  description: 'Convert YAML text to JSON format',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, indent } = inputSchema.parse(input);

    try {
      const parsed = YAML.parse(text);
      const json = JSON.stringify(parsed, null, indent);

      return { text: json };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid YAML: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
