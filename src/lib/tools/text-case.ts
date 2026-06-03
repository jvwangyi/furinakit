import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  case: z.enum(['upper', 'lower', 'title', 'camel', 'snake', 'kebab', 'pascal', 'sentence']),
});

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, char => char.toUpperCase());
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

function toSentenceCase(str: string): string {
  return str
    .replace(/^[a-z]/, char => char.toUpperCase())
    .replace(/([.!?]\s+)([a-z])/g, (_, sep, char) => sep + char.toUpperCase());
}

const tool: Tool = {
  name: 'text-case',
  description: 'Convert text between different cases (upper, lower, title, camel, snake, kebab, pascal, sentence)',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, case: targetCase } = inputSchema.parse(input);

    let result: string;

    switch (targetCase) {
      case 'upper':
        result = text.toUpperCase();
        break;
      case 'lower':
        result = text.toLowerCase();
        break;
      case 'title':
        result = toTitleCase(text);
        break;
      case 'camel':
        result = toCamelCase(text);
        break;
      case 'snake':
        result = toSnakeCase(text);
        break;
      case 'kebab':
        result = toKebabCase(text);
        break;
      case 'pascal':
        result = toPascalCase(text);
        break;
      case 'sentence':
        result = toSentenceCase(text);
        break;
      default:
        throw new ToolError(ErrorCode.INVALID_INPUT, `Unknown case: ${targetCase}`);
    }

    return { text: result };
  },
};

register(tool);
export default tool;
