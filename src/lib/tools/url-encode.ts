import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  action: z.enum(['encode', 'decode']),
  component: z.enum(['full', 'component']).default('component'),
});

const tool: Tool = {
  name: 'url-encode',
  description: 'Encode or decode URL strings',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, action, component } = inputSchema.parse(input);
    
    if (action === 'encode') {
      const encoded = component === 'full' 
        ? encodeURI(text)
        : encodeURIComponent(text);
      return { text: encoded };
    }
    
    // decode
    try {
      const decoded = component === 'full'
        ? decodeURI(text)
        : decodeURIComponent(text);
      return { text: decoded };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid URL encoded string');
    }
  },
};

register(tool);
export default tool;
