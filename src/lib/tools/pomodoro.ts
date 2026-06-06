import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const tool: Tool = {
  name: 'pomodoro',
  description: 'Pomodoro timer with customizable work and break durations',
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
