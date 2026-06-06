import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const FONTS = [
  'Standard', 'Slant', 'Banner', 'Big', 'Block',
  'Bubble', 'Digital', 'Ivrit', 'Larry3d', 'Lean',
  'Mini', 'Script', 'Shadow', 'Small', 'Speed',
  'Star Wars', 'Stop', 'Calvin S',
];

const inputSchema = z.object({
  text: z.string().min(1).max(200),
  font: z.enum(FONTS as [string, ...string[]]).default('Standard'),
});

const tool: Tool = {
  name: 'ascii-art',
  description: 'Generate ASCII art from text using figlet',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, font } = inputSchema.parse(input);

    try {
      // Dynamic import to avoid bundling figlet fonts at build time
      const figletModule = await import('figlet');
      const figlet = figletModule.default;
      const result = figlet.textSync(text, {
        font: font as import('figlet').FontName,
        horizontalLayout: 'default',
        verticalLayout: 'default',
      });

      return { text: result };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, `ASCII art generation failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
