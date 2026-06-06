import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const tool: Tool = {
  name: 'business-card',
  description: 'Generate digital business cards with customizable templates',
  category: 'craft',
  inputSchema: z.object({
    dummy: z.string().optional(),
  }),
  execute: async (): Promise<ToolResult> => {
    // Pure frontend tool — no server-side processing needed
    return { text: 'Please use the web interface for this tool' };
  },
};

register(tool);
export default tool;
