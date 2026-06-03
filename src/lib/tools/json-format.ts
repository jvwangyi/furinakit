import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const inputSchema = z.object({
  text: z.string(),
  indent: z.number().min(0).max(10).default(2),
  sortKeys: z.boolean().default(false),
});

const tool: Tool = {
  name: 'json-format',
  description: 'Format and prettify JSON strings',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, indent, sortKeys } = inputSchema.parse(input);
    
    try {
      let parsed = JSON.parse(text);
      
      if (sortKeys) {
        parsed = sortObjectKeys(parsed);
      }
      
      const formatted = JSON.stringify(parsed, null, indent);
      
      return {
        text: formatted,
      };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid JSON: ${(e as Error).message}`);
    }
  },
};

function sortObjectKeys(obj: JsonValue): JsonValue {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, JsonValue>>((result, key) => {
        result[key] = sortObjectKeys((obj as Record<string, JsonValue>)[key]);
        return result;
      }, {});
  }
  return obj;
}

register(tool);
export default tool;
