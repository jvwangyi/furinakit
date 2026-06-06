import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string().min(1).max(500),
  font: z.string().default('system-ui'),
  size: z.number().int().min(8).max(200).default(24),
  weight: z.number().int().min(100).max(900).default(400),
  style: z.enum(['normal', 'italic', 'oblique']).default('normal'),
  letterSpacing: z.number().min(-10).max(20).default(0),
  lineHeight: z.number().min(0.5).max(3).default(1.5),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ffffff'),
});

const tool: Tool = {
  name: 'font-preview',
  description: 'Preview text with different font styles and sizes',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, font, size, weight, style, letterSpacing, lineHeight, color, backgroundColor } = inputSchema.parse(input);

    const css = `font-family: ${font}; font-size: ${size}px; font-weight: ${weight}; font-style: ${style}; letter-spacing: ${letterSpacing}px; line-height: ${lineHeight}; color: ${color}; background-color: ${backgroundColor};`;

    const html = `<div style="${css} padding: 24px; border-radius: 8px; display: inline-block; max-width: 100%; overflow-wrap: break-word; word-break: break-word;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`;

    return {
      text: JSON.stringify({
        text,
        css,
        html,
        preview: {
          font,
          size: `${size}px`,
          weight,
          style,
          letterSpacing: `${letterSpacing}px`,
          lineHeight,
          color,
          backgroundColor,
        },
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
