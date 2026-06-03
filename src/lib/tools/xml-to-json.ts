import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  indent: z.number().min(0).max(10).default(2),
  ignoreAttributes: z.boolean().default(false),
  attributeNamePrefix: z.string().default('@'),
});

const tool: Tool = {
  name: 'xml-to-json',
  description: 'Convert XML text to JSON format',
  category: 'convert',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, indent, ignoreAttributes, attributeNamePrefix } = inputSchema.parse(input);

    try {
      const parser = new XMLParser({
        ignoreAttributes,
        attributeNamePrefix,
      });

      const parsed = parser.parse(text);
      const json = JSON.stringify(parsed, null, indent);

      return { text: json };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid XML: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
