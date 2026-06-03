import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string().url(),
});

const tool: Tool = {
  name: 'url-parser',
  description: 'Parse a URL into its component parts',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text } = inputSchema.parse(input);
    const parsed = new URL(text);

    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const result = {
      href: parsed.href,
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port || null,
      pathname: parsed.pathname,
      search: parsed.search || null,
      query: Object.keys(queryParams).length > 0 ? queryParams : null,
      hash: parsed.hash || null,
      origin: parsed.origin,
    };

    return {
      text: JSON.stringify(result, null, 2),
    };
  },
};

register(tool);
export default tool;
