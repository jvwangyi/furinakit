import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  code: z.string().min(1),
  language: z.enum(['html', 'css', 'javascript']),
  options: z.object({
    removeComments: z.boolean().default(true),
    collapseWhitespace: z.boolean().default(true),
    minifyCSS: z.boolean().default(true),
    minifyJS: z.boolean().default(true),
  }).default({
    removeComments: true,
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
  }),
});

// Simple CSS minifier
function minifyCSSString(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s*{\s*/g, '{')          // Remove space around {
    .replace(/\s*}\s*/g, '}')          // Remove space around }
    .replace(/\s*:\s*/g, ':')          // Remove space around :
    .replace(/\s*;\s*/g, ';')          // Remove space around ;
    .replace(/\s*,\s*/g, ',')          // Remove space around ,
    .replace(/;}/g, '}')               // Remove last semicolon
    .replace(/\s{2,}/g, ' ')           // Collapse whitespace
    .trim();
}

// Simple JS minifier (basic - not a full parser)
function minifyJSString(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')           // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
    .replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, '$1')  // Remove space around operators
    .replace(/\s{2,}/g, ' ')           // Collapse whitespace
    .replace(/^\s+|\s+$/gm, '')        // Trim lines
    .replace(/\n{2,}/g, '\n')          // Collapse blank lines
    .trim();
}

// Simple HTML minifier
function minifyHTML(code: string, opts: { removeComments?: boolean; collapseWhitespace?: boolean; minifyCSS?: boolean; minifyJS?: boolean }): string {
  let result = code;

  // Remove HTML comments
  if (opts.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  // Collapse whitespace (but preserve content inside <pre>, <code>, <textarea>)
  if (opts.collapseWhitespace) {
    // Protect pre/code/textarea blocks
    const protectedBlocks: string[] = [];
    result = result.replace(/(<pre[\s>][\s\S]*?<\/pre>|<code[\s>][\s\S]*?<\/code>|<textarea[\s>][\s\S]*?<\/textarea>)/gi, (match) => {
      protectedBlocks.push(match);
      return `__PROTECTED_${protectedBlocks.length - 1}__`;
    });

    // Collapse whitespace between tags
    result = result.replace(/>\s+</g, '><');
    // Collapse multiple spaces to single
    result = result.replace(/\s{2,}/g, ' ');
    // Remove leading/trailing whitespace per line
    result = result.replace(/^\s+|\s+$/gm, '');

    // Restore protected blocks
    protectedBlocks.forEach((block, i) => {
      result = result.replace(`__PROTECTED_${i}__`, block);
    });
  }

  // Minify inline CSS
  if (opts.minifyCSS) {
    result = result.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, css, close) => {
      const minified = minifyCSSString(css);
      return `${open}${minified}${close}`;
    });
    result = result.replace(/style="([^"]*)"/g, (_, css) => {
      return `style="${minifyCSSString(css)}"`;
    });
  }

  // Minify inline JS
  if (opts.minifyJS) {
    result = result.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (_, open, js, close) => {
      const minified = minifyJSString(js);
      return `${open}${minified}${close}`;
    });
  }

  return result.trim();
}

const tool: Tool = {
  name: 'code-minify',
  description: 'Minify HTML, CSS, and JavaScript code',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { code, language, options } = inputSchema.parse(input);

    let result: string;
    const originalSize = Buffer.byteLength(code, 'utf-8');

    switch (language) {
      case 'html':
        result = minifyHTML(code, options);
        break;
      case 'css':
        result = minifyCSSString(code);
        break;
      case 'javascript':
        result = minifyJSString(code);
        break;
      default:
        return { text: JSON.stringify({ error: `Unsupported language: ${language}` }) };
    }

    const minifiedSize = Buffer.byteLength(result, 'utf-8');
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

    return {
      text: JSON.stringify({
        result,
        stats: {
          originalSize: `${(originalSize / 1024).toFixed(1)} KB`,
          minifiedSize: `${(minifiedSize / 1024).toFixed(1)} KB`,
          savings: `${savings}%`,
          reducedBytes: originalSize - minifiedSize,
        },
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
