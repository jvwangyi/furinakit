import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string().min(1),
  fromBase: z.number().int().min(2).max(36),
  toBase: z.number().int().min(2).max(36),
});

const tool: Tool = {
  name: 'base-converter',
  description: 'Convert numbers between different bases (2-36)',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, fromBase, toBase } = inputSchema.parse(input);

    const decimal = parseInt(text, fromBase);
    if (isNaN(decimal)) {
      return { text: JSON.stringify({ error: `Cannot parse "${text}" as base ${fromBase}` }) };
    }

    const converted = decimal.toString(toBase).toUpperCase();

    return {
      text: JSON.stringify({
        input: text,
        fromBase,
        toBase,
        decimal,
        result: converted,
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
