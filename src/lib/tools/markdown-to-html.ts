import { z } from 'zod';
import { marked } from 'marked';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  gfm: z.boolean().default(true),
  breaks: z.boolean().default(false),
});

const tool: Tool = {
  name: 'markdown-to-html',
  description: 'Convert Markdown to HTML',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, gfm, breaks } = inputSchema.parse(input);

    try {
      marked.setOptions({
        gfm,
        breaks,
      });

      const html = await marked(text);

      return { text: html };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Markdown conversion failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
