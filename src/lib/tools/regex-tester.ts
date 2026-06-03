import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  text: z.string(),
  pattern: z.string(),
  flags: z.string().default('g'),
});

interface MatchResult {
  match: string;
  index: number;
  groups?: Record<string, string>[];
}

const tool: Tool = {
  name: 'regex-tester',
  description: 'Test regular expressions against text with match details',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, pattern, flags } = inputSchema.parse(input);

    try {
      const regex = new RegExp(pattern, flags);
      const matches: MatchResult[] = [];

      // Find all matches
      let match: RegExpExecArray | null;
      const globalRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');

      while ((match = globalRegex.exec(text)) !== null) {
        const groups: Record<string, string>[] = [];

        // Capture groups
        if (match.length > 1) {
          for (let i = 1; i < match.length; i++) {
            groups.push({ [`$${i}`]: match[i] ?? '' });
          }
        }

        // Named groups
        if (match.groups) {
          for (const [name, value] of Object.entries(match.groups)) {
            groups.push({ [name]: value ?? '' });
          }
        }

        matches.push({
          match: match[0],
          index: match.index,
          groups: groups.length > 0 ? groups : undefined,
        });

        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          globalRegex.lastIndex++;
        }
      }

      // Also test with the original regex for isMatch
      const isMatch = new RegExp(pattern, flags).test(text);

      const result = {
        isMatch,
        matchCount: matches.length,
        matches,
        pattern,
        flags,
      };

      return { text: JSON.stringify(result, null, 2) };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid regex: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
