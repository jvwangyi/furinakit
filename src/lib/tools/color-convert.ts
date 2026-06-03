import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  color: z.string(),
  from: z.enum(['hex', 'rgb', 'hsl']),
  to: z.enum(['hex', 'rgb', 'hsl']),
});

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function parseHex(hex: string): RGB {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(hex)) {
    throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function parseRgb(rgb: string): RGB {
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) {
    throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid RGB color: ${rgb}`);
  }
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
  };
}

function parseHsl(hsl: string): HSL {
  const match = hsl.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/);
  if (!match) {
    throw new ToolError(ErrorCode.INVALID_INPUT, `Invalid HSL color: ${hsl}`);
  }
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
    default:
      h = 0;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

function hexToHsl(hex: string): HSL {
  return rgbToHsl(parseHex(hex));
}

const tool: Tool = {
  name: 'color-convert',
  description: 'Convert colors between HEX, RGB, and HSL formats',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { color, from, to } = inputSchema.parse(input);

    try {
      let result: string;

      // Direct conversions
      if (from === to) {
        result = color;
      } else if (from === 'hex' && to === 'rgb') {
        const rgb = parseHex(color);
        result = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      } else if (from === 'hex' && to === 'hsl') {
        const hsl = hexToHsl(color);
        result = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      } else if (from === 'rgb' && to === 'hex') {
        result = rgbToHex(parseRgb(color));
      } else if (from === 'rgb' && to === 'hsl') {
        const hsl = rgbToHsl(parseRgb(color));
        result = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      } else if (from === 'hsl' && to === 'hex') {
        result = hslToHex(parseHsl(color));
      } else if (from === 'hsl' && to === 'rgb') {
        const rgb = hslToRgb(parseHsl(color));
        result = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      } else {
        throw new ToolError(ErrorCode.INVALID_INPUT, `Unsupported conversion: ${from} -> ${to}`);
      }

      return {
        text: JSON.stringify({
          input: color,
          from,
          to,
          result,
        }, null, 2),
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Color conversion failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
