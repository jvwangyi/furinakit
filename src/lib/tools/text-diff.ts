import { z } from 'zod';
import { diffLines, diffWords, diffChars } from 'diff';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  oldText: z.string(),
  newText: z.string(),
  mode: z.enum(['lines', 'words', 'chars']).default('lines'),
});

const tool: Tool = {
  name: 'text-diff',
  description: 'Compare two texts and show differences',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { oldText, newText, mode } = inputSchema.parse(input);

    try {
      let changes;
      switch (mode) {
        case 'words':
          changes = diffWords(oldText, newText);
          break;
        case 'chars':
          changes = diffChars(oldText, newText);
          break;
        default:
          changes = diffLines(oldText, newText);
      }

      let result = '';
      for (const part of changes) {
        if (part.added) {
          result += `\x1b[32m+${part.value}\x1b[0m`;
        } else if (part.removed) {
          result += `\x1b[31m-${part.value}\x1b[0m`;
        } else {
          result += part.value;
        }
      }

      const stats = {
        additions: changes.filter(c => c.added).length,
        deletions: changes.filter(c => c.removed).length,
        unchanged: changes.filter(c => !c.added && !c.removed).length,
      };

      return {
        text: result,
        data: JSON.stringify(stats),
      };
    } catch (e) {
      throw new ToolError(ErrorCode.PROCESS_FAILED, `Text diff failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
