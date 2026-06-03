import { z } from 'zod';
import { XMLBuilder } from 'fast-xml-parser';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  rootName: z.string().default('root'),
  indent: z.number().min(0).max(10).default(2),
  arrayItemName: z.string().default('item'),
});

const tool: Tool = {
  name: 'json-to-xml',
  description: 'Convert JSON to XML format',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, rootName, indent, arrayItemName } = inputSchema.parse(input);

    try {
      const parsed = JSON.parse(text);

      const builder = new XMLBuilder({
        format: true,
        indentBy: ' '.repeat(indent),
        arrayNodeName: arrayItemName,
        ignoreAttributes: false,
      });

      // Wrap in root element if input is an array or primitive
      const wrapped = Array.isArray(parsed) || typeof parsed !== 'object'
        ? { [rootName]: parsed }
        : parsed;

      const xml = builder.build(wrapped);

      return { text: xml };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid JSON: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
