import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  scheme: z.enum(['complementary', 'analogous', 'triadic', 'split-complementary', 'monochromatic']),
  count: z.number().int().min(2).max(10).default(5),
});

// HSL helpers
function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Contrast ratio calculation (WCAG)
function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const adjust = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function generatePalette(baseColor: string, scheme: string, count: number): { hex: string; name: string }[] {
  const [h, s, l] = hexToHSL(baseColor);
  const colors: { hex: string; name: string }[] = [{ hex: baseColor, name: 'Base' }];

  switch (scheme) {
    case 'complementary':
      colors.push({ hex: hslToHex(h + 180, s, l), name: 'Complementary' });
      for (let i = 1; colors.length < count; i++) {
        colors.push({ hex: hslToHex(h, s, l + i * 10), name: `Light ${i}` });
        if (colors.length < count) colors.push({ hex: hslToHex(h + 180, s, l + i * 10), name: `Comp Light ${i}` });
      }
      break;
    case 'analogous':
      for (let i = 1; colors.length < count; i++) {
        colors.push({ hex: hslToHex(h + i * 30, s, l), name: `Analogous +${i * 30}°` });
        if (colors.length < count) colors.push({ hex: hslToHex(h - i * 30, s, l), name: `Analogous -${i * 30}°` });
      }
      break;
    case 'triadic':
      colors.push({ hex: hslToHex(h + 120, s, l), name: 'Triadic 120°' });
      colors.push({ hex: hslToHex(h + 240, s, l), name: 'Triadic 240°' });
      for (let i = 1; colors.length < count; i++) {
        colors.push({ hex: hslToHex(h, s, l + i * 8), name: `Shade ${i}` });
      }
      break;
    case 'split-complementary':
      colors.push({ hex: hslToHex(h + 150, s, l), name: 'Split Comp 150°' });
      colors.push({ hex: hslToHex(h + 210, s, l), name: 'Split Comp 210°' });
      for (let i = 1; colors.length < count; i++) {
        colors.push({ hex: hslToHex(h, s, l + i * 10), name: `Variant ${i}` });
      }
      break;
    case 'monochromatic':
      for (let i = 1; colors.length < count; i++) {
        const step = (i * 80) / count;
        colors.push({ hex: hslToHex(h, s, Math.max(10, l - 40 + step)), name: `Mono ${i}` });
      }
      break;
  }

  return colors.slice(0, count);
}

const tool: Tool = {
  name: 'color-palette',
  description: 'Generate color palettes with accessibility info',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { color, scheme, count } = inputSchema.parse(input);

    const palette = generatePalette(color, scheme, count);

    // Add contrast info against white and black
    const withContrast = palette.map(c => ({
      ...c,
      contrastWhite: Math.round(contrastRatio(c.hex, '#ffffff') * 100) / 100,
      contrastBlack: Math.round(contrastRatio(c.hex, '#000000') * 100) / 100,
      wcagAA: contrastRatio(c.hex, '#ffffff') >= 4.5 || contrastRatio(c.hex, '#000000') >= 4.5,
      wcagAAA: contrastRatio(c.hex, '#ffffff') >= 7 || contrastRatio(c.hex, '#000000') >= 7,
    }));

    return {
      text: JSON.stringify({
        baseColor: color,
        scheme,
        palette: withContrast,
        css: withContrast.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n'),
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
