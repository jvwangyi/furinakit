import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  svg: z.string().min(1),
  options: z.object({
    removeComments: z.boolean().default(true),
    removeMetadata: z.boolean().default(true),
    removeEditorData: z.boolean().default(true),
    removeHidden: z.boolean().default(true),
    collapseWhitespace: z.boolean().default(true),
    removeEmptyGroups: z.boolean().default(true),
    decimalPrecision: z.number().int().min(0).max(6).default(2),
  }).default(() => ({
    removeComments: true,
    removeMetadata: true,
    removeEditorData: true,
    removeHidden: true,
    collapseWhitespace: true,
    removeEmptyGroups: true,
    decimalPrecision: 2,
  })),
});

function optimizeSVG(svg: string, opts: {
  removeComments?: boolean;
  removeMetadata?: boolean;
  removeEditorData?: boolean;
  removeHidden?: boolean;
  collapseWhitespace?: boolean;
  removeEmptyGroups?: boolean;
  decimalPrecision?: number;
}): { result: string; stats: { original: number; optimized: number; savings: string } } {
  let result = svg;
  const originalSize = Buffer.byteLength(result, 'utf-8');

  // Remove XML comments
  if (opts.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Remove metadata elements
  if (opts.removeMetadata) {
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    result = result.replace(/<rdf:RDF[\s\S]*?<\/rdf:RDF>/gi, '');
    result = result.replace(/<cc:License[\s\S]*?<\/cc:License>/gi, '');
  }

  // Remove editor-specific data
  if (opts.removeEditorData) {
    result = result.replace(/\s*sodipodi:[a-z-]+="[^"]*"/gi, '');
    result = result.replace(/\s*inkscape:[a-z-]+="[^"]*"/gi, '');
    result = result.replace(/\s*xmlns:sodipodi="[^"]*"/gi, '');
    result = result.replace(/\s*xmlns:inkscape="[^"]*"/gi, '');
    result = result.replace(/<sodipodi:namedview[\s\S]*?\/>/gi, '');
    result = result.replace(/<sodipodi:namedview[\s\S]*?<\/sodipodi:namedview>/gi, '');
  }

  // Remove hidden elements
  if (opts.removeHidden) {
    result = result.replace(/<[^>]*visibility="hidden"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    result = result.replace(/<[^>]*display="none"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    result = result.replace(/<[^>]*\s+style="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');
  }

  // Round decimal numbers
  if (opts.decimalPrecision !== undefined) {
    const precision = opts.decimalPrecision;
    result = result.replace(/(\d+\.\d{3,})/g, (_, num) => {
      return parseFloat(num).toFixed(precision);
    });
  }

  // Collapse whitespace
  if (opts.collapseWhitespace) {
    result = result.replace(/>\s+</g, '><');
    result = result.replace(/\s{2,}/g, ' ');
    result = result.replace(/^\s+|\s+$/gm, '');
  }

  // Remove empty <g> groups
  if (opts.removeEmptyGroups) {
    let prev = '';
    while (prev !== result) {
      prev = result;
      result = result.replace(/<g\s*(?:id="[^"]*")?\s*>\s*<\/g>/gi, '');
    }
  }

  // Clean up empty attributes
  result = result.replace(/\s+[a-z-]+=""\s*/gi, ' ');

  // Final cleanup
  result = result.trim();

  const optimizedSize = Buffer.byteLength(result, 'utf-8');
  const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  return {
    result,
    stats: {
      original: originalSize,
      optimized: optimizedSize,
      savings: `${savings}%`,
    },
  };
}

const tool: Tool = {
  name: 'svg-optimize',
  description: 'Optimize SVG files by removing metadata and unnecessary data',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { svg, options } = inputSchema.parse(input);

    try {
      const { result, stats } = optimizeSVG(svg, options);
      return { text: JSON.stringify({ result, stats }, null, 2) };
    } catch (err: any) {
      return { text: JSON.stringify({ error: err.message || 'SVG optimization failed' }) };
    }
  },
};

register(tool);
export default tool;
