import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string().min(1),
  indent: z.number().int().min(1).max(8).default(2),
});

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function formatHtml(input: string, indentSize: number): string {
  const indent = ' '.repeat(indentSize);
  let result = '';
  let level = 0;

  // Tokenize: split into tags and text
  const tokens: { type: 'tag' | 'text' | 'comment'; value: string }[] = [];
  let pos = 0;
  const src = input.trim();

  while (pos < src.length) {
    // Comment
    if (src.startsWith('<!--', pos)) {
      const end = src.indexOf('-->', pos + 4);
      if (end !== -1) {
        tokens.push({ type: 'comment', value: src.substring(pos, end + 3) });
        pos = end + 3;
        continue;
      }
    }

    // Tag
    if (src[pos] === '<') {
      const end = src.indexOf('>', pos);
      if (end !== -1) {
        tokens.push({ type: 'tag', value: src.substring(pos, end + 1) });
        pos = end + 1;
        continue;
      }
    }

    // Text
    const nextTag = src.indexOf('<', pos);
    const text = nextTag === -1 ? src.substring(pos) : src.substring(pos, nextTag);
    if (text.trim()) {
      tokens.push({ type: 'text', value: text.trim() });
    }
    pos = nextTag === -1 ? src.length : nextTag;
  }

  for (const token of tokens) {
    if (token.type === 'comment') {
      result += indent.repeat(level) + token.value + '\n';
      continue;
    }

    if (token.type === 'text') {
      result += indent.repeat(level) + token.value + '\n';
      continue;
    }

    const tag = token.value;

    // Self-closing or DOCTYPE
    if (tag.startsWith('<!') || tag.endsWith('/>')) {
      result += indent.repeat(level) + tag + '\n';
      continue;
    }

    // Closing tag
    if (tag.startsWith('</')) {
      level = Math.max(0, level - 1);
      result += indent.repeat(level) + tag + '\n';
      continue;
    }

    // Opening tag
    const match = tag.match(/^<(\w+)/);
    const tagName = match ? match[1].toLowerCase() : '';

    result += indent.repeat(level) + tag + '\n';

    if (!VOID_ELEMENTS.has(tagName)) {
      level++;
    }
  }

  return result.trimEnd() + '\n';
}

const tool: Tool = {
  name: 'html-format',
  description: 'Format and beautify HTML code',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, indent } = inputSchema.parse(input);
    const formatted = formatHtml(text, indent);
    return { text: formatted };
  },
};

register(tool);
export default tool;
