import { z } from 'zod';
import { randomUUID } from 'crypto';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
  version: z.literal(4).default(4),
});

const tool: Tool = {
  name: 'uuid-gen',
  description: 'Generate UUID v4 identifiers',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { count } = inputSchema.parse(input);

    const uuids: string[] = [];
    for (let i = 0; i < count; i++) {
      uuids.push(randomUUID());
    }

    return {
      text: JSON.stringify({
        count: uuids.length,
        uuids,
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
