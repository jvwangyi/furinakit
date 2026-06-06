import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const colorStopSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{3,8}$/),
  position: z.number().min(0).max(100),
});

const inputSchema = z.object({
  type: z.enum(['linear', 'radial', 'conic']),
  angle: z.number().min(0).max(360).default(180),
  colorStops: z.array(colorStopSchema).min(2).max(10),
  shape: z.enum(['circle', 'ellipse']).default('circle'),
});

function buildGradientCSS(type: string, angle: number, colorStops: { color: string; position: number }[], shape: string): string {
  const stops = colorStops.map(s => `${s.color} ${s.position}%`).join(', ');

  switch (type) {
    case 'linear':
      return `linear-gradient(${angle}deg, ${stops})`;
    case 'radial':
      return `radial-gradient(${shape}, ${stops})`;
    case 'conic':
      return `conic-gradient(from ${angle}deg, ${stops})`;
    default:
      return '';
  }
}

const tool: Tool = {
  name: 'css-gradient',
  description: 'Generate CSS gradient code (linear, radial, conic)',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { type, angle, colorStops, shape } = inputSchema.parse(input);

    const css = buildGradientCSS(type, angle, colorStops, shape);

    const cssCode = `background: ${css};`;

    // Also generate webkit prefix for older browsers
    const webkitCss = type === 'linear'
      ? `background: -webkit-linear-gradient(${angle}deg, ${colorStops.map(s => `${s.color} ${s.position}%`).join(', ')});\n${cssCode}`
      : cssCode;

    return {
      text: JSON.stringify({
        type,
        angle,
        colorStops,
        shape,
        css: webkitCss,
        preview: css,
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
