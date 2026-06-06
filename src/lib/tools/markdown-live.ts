import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { marked } from 'marked';

const inputSchema = z.object({
  markdown: z.string().min(1),
  renderMode: z.enum(['html', 'text']).default('html'),
});

// Configure marked for safe output
marked.setOptions({
  gfm: true,
  breaks: true,
});

const tool: Tool = {
  name: 'markdown-live',
  description: 'Live Markdown editor with real-time HTML preview',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    try {
      const { markdown, renderMode } = inputSchema.parse(input);
      if (renderMode === 'html') {
        const html = await marked.parse(markdown);
        return {
          text: JSON.stringify({
            html,
            markdown,
            lineCount: markdown.split('\n').length,
            charCount: markdown.length,
            wordCount: markdown.trim().split(/\s+/).filter(w => w.length > 0).length,
          }, null, 2),
        };
      } else {
        // Return raw text with stats
        return {
          text: JSON.stringify({
            markdown,
            lineCount: markdown.split('\n').length,
            charCount: markdown.length,
            wordCount: markdown.trim().split(/\s+/).filter(w => w.length > 0).length,
          }, null, 2),
        };
      }
    } catch (err: any) {
      return { text: JSON.stringify({ error: err.message || 'Markdown parsing failed' }) };
    }
  },
};

register(tool);
export default tool;
