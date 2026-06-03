import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string().min(1),
  indent: z.number().int().min(1).max(8).default(2),
});

function formatJs(input: string, indentSize: number): string {
  const indent = ' '.repeat(indentSize);
  let result = '';
  let level = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let i = 0;
  let lastNonSpace = '';

  const trimmed = input.trim();

  const pushIndent = () => {
    result += indent.repeat(level);
  };

  const isNewLine = () => result.endsWith('\n') || result.length === 0;

  while (i < trimmed.length) {
    const ch = trimmed[i];
    const next = trimmed[i + 1];

    // Handle line comments
    if (inLineComment) {
      result += ch;
      if (ch === '\n') {
        inLineComment = false;
        result += indent.repeat(level);
      }
      i++;
      continue;
    }

    // Handle block comments
    if (inBlockComment) {
      result += ch;
      if (ch === '*' && next === '/') {
        result += '/';
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Handle strings
    if (inString) {
      result += ch;
      if (ch === stringChar && trimmed[i - 1] !== '\\') {
        inString = false;
      }
      i++;
      continue;
    }

    // Detect comments
    if (ch === '/' && next === '/') {
      if (!isNewLine()) result += '\n';
      pushIndent();
      result += '//';
      inLineComment = true;
      i += 2;
      continue;
    }

    if (ch === '/' && next === '*') {
      if (!isNewLine()) result += '\n';
      pushIndent();
      result += '/*';
      inBlockComment = true;
      i += 2;
      continue;
    }

    // Detect strings
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      result += ch;
      i++;
      continue;
    }

    // Opening brace
    if (ch === '{') {
      result = result.trimEnd();
      if (!result.endsWith(' ') && !result.endsWith('\n')) result += ' ';
      result += '{\n';
      level++;
      pushIndent();
      i++;
      if (trimmed[i] === ' ') i++;
      continue;
    }

    // Closing brace
    if (ch === '}') {
      level = Math.max(0, level - 1);
      if (!isNewLine()) {
        result = result.trimEnd() + '\n';
      }
      pushIndent();
      result += '}';
      i++;
      // Handle optional semicolon after }
      if (trimmed[i] === ';') {
        result += ';';
        i++;
      }
      result += '\n';
      pushIndent();
      if (trimmed[i] === ' ') i++;
      continue;
    }

    // Semicolons
    if (ch === ';') {
      result = result.trimEnd() + ';\n';
      pushIndent();
      i++;
      if (trimmed[i] === ' ') i++;
      continue;
    }

    // Newlines from source
    if (ch === '\n') {
      if (!isNewLine()) {
        result += '\n';
        pushIndent();
      }
      i++;
      continue;
    }

    result += ch;
    lastNonSpace = ch === ' ' ? lastNonSpace : ch;
    i++;
  }

  return result
    .split('\n')
    .map(line => line.trimEnd())
    .filter((line, idx, arr) => !(line === '' && idx > 0 && arr[idx - 1] === ''))
    .join('\n')
    .trim() + '\n';
}

const tool: Tool = {
  name: 'js-format',
  description: 'Format and beautify JavaScript code',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, indent } = inputSchema.parse(input);
    const formatted = formatJs(text, indent);
    return { text: formatted };
  },
};

register(tool);
export default tool;
