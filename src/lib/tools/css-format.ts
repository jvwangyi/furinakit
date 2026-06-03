import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string().min(1),
  indent: z.number().int().min(1).max(8).default(2),
});

function formatCss(input: string, indentSize: number): string {
  const indent = ' '.repeat(indentSize);
  let result = '';
  let level = 0;
  let inString = false;
  let stringChar = '';
  let i = 0;

  // Normalize whitespace first
  const css = input.replace(/\s+/g, ' ').trim();

  while (i < css.length) {
    const ch = css[i];

    // Handle strings
    if (inString) {
      result += ch;
      if (ch === stringChar && css[i - 1] !== '\\') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      result += ch;
      i++;
      continue;
    }

    // Handle comments
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end !== -1) {
        const comment = css.substring(i, end + 2).trim();
        result += '\n' + indent.repeat(level) + comment + '\n' + indent.repeat(level);
        i = end + 2;
        continue;
      }
    }

    if (ch === '{') {
      result = result.trimEnd() + ' {\n';
      level++;
      result += indent.repeat(level);
      i++;
      // Skip space after {
      if (css[i] === ' ') i++;
      continue;
    }

    if (ch === '}') {
      level = Math.max(0, level - 1);
      result = result.trimEnd() + '\n' + indent.repeat(level) + '}\n';
      i++;
      // Skip space after }
      if (css[i] === ' ') i++;
      continue;
    }

    if (ch === ';') {
      result = result.trimEnd() + ';\n' + indent.repeat(level);
      i++;
      if (css[i] === ' ') i++;
      continue;
    }

    result += ch;
    i++;
  }

  // Clean up extra blank lines and trim
  return result
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, idx, arr) => !(line === '' && idx > 0 && arr[idx - 1] === ''))
    .join('\n')
    .trim() + '\n';
}

const tool: Tool = {
  name: 'css-format',
  description: 'Format and beautify CSS code',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, indent } = inputSchema.parse(input);
    const formatted = formatCss(text, indent);
    return { text: formatted };
  },
};

register(tool);
export default tool;
