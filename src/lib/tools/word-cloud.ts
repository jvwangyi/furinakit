import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F1948A', '#82E0AA', '#F8C471', '#AED6F1', '#D7BDE2',
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor',
  'not', 'so', 'very', 'just', 'than', 'too', 'also', 'it', 'its',
  'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都',
  '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
  '会', '着', '没有', '看', '好', '自己', '这', '他', '她', '它',
]);

const inputSchema = z.object({
  text: z.string().min(10).max(10000),
  maxWords: z.number().int().min(5).max(200).default(50),
  colors: z.array(z.string()).optional(),
  width: z.number().int().min(200).max(2000).default(800),
  height: z.number().int().min(200).max(2000).default(600),
});

interface WordPlacement {
  word: string;
  count: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

function extractWords(text: string): Map<string, number> {
  const wordCounts = new Map<string, number>();
  // Split on whitespace and punctuation, keep CJK characters as individual tokens
  const tokens = text.toLowerCase().match(/[\u4e00-\u9fff]|[a-z\u00c0-\u024f]+(?:'[a-z]+)?/g) || [];

  for (const token of tokens) {
    if (token.length < 2 && !/[\u4e00-\u9fff]/.test(token)) continue;
    if (STOP_WORDS.has(token)) continue;
    wordCounts.set(token, (wordCounts.get(token) || 0) + 1);
  }

  return wordCounts;
}

function estimateTextWidth(text: string, fontSize: number): number {
  // Approximate: CJK chars are ~1em wide, Latin chars ~0.6em
  let width = 0;
  for (const ch of text) {
    if (/[\u4e00-\u9fff]/.test(ch)) {
      width += fontSize;
    } else {
      width += fontSize * 0.6;
    }
  }
  return width;
}

function generateWordCloud(
  text: string,
  maxWords: number,
  colors: string[],
  width: number,
  height: number,
): string {
  const wordCounts = extractWords(text);
  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords);

  if (sortedWords.length === 0) {
    throw new ToolError(ErrorCode.INVALID_INPUT, 'No valid words found in text');
  }

  const maxCount = sortedWords[0][1];
  const minCount = sortedWords[sortedWords.length - 1][1];
  const minFontSize = 12;
  const maxFontSize = Math.min(72, width / 6);

  const placements: WordPlacement[] = [];
  const occupied: { x: number; y: number; w: number; h: number }[] = [];

  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < sortedWords.length; i++) {
    const [word, count] = sortedWords[i];
    const ratio = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
    const fontSize = minFontSize + ratio * (maxFontSize - minFontSize);
    const textWidth = estimateTextWidth(word, fontSize);
    const textHeight = fontSize * 1.2;
    const rotation = Math.random() < 0.3 ? (Math.random() < 0.5 ? -90 : 90) : 0;

    const actualW = rotation !== 0 ? textHeight : textWidth;
    const actualH = rotation !== 0 ? textWidth : textHeight;

    // Spiral placement
    let placed = false;
    for (let t = 0; t < 1500 && !placed; t++) {
      const angle = t * 0.15;
      const radius = t * 0.8;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const box = {
        x: x - actualW / 2,
        y: y - actualH / 2,
        w: actualW,
        h: actualH,
      };

      // Check bounds
      if (box.x < 0 || box.y < 0 || box.x + box.w > width || box.y + box.h > height) continue;

      // Check collision
      let collides = false;
      for (const o of occupied) {
        if (box.x < o.x + o.w && box.x + box.w > o.x &&
            box.y < o.y + o.h && box.y + box.h > o.y) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        occupied.push(box);
        placements.push({
          word,
          count,
          x,
          y,
          size: Math.round(fontSize),
          color: colors[i % colors.length],
          rotation,
        });
        placed = true;
      }
    }
  }

  // Generate SVG
  const svgParts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="white"/>`,
  ];

  for (const p of placements) {
    const transform = p.rotation !== 0 ? ` transform="rotate(${p.rotation} ${p.x} ${p.y})"` : '';
    svgParts.push(
      `<text x="${p.x}" y="${p.y}" font-size="${p.size}" fill="${p.color}" text-anchor="middle" dominant-baseline="central" font-family="sans-serif"${transform}>${escapeXml(p.word)}</text>`
    );
  }

  svgParts.push('</svg>');
  return svgParts.join('\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const tool: Tool = {
  name: 'word-cloud',
  description: 'Generate word cloud SVG from text',
  category: 'craft',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text, maxWords, colors, width, height } = inputSchema.parse(input);

    try {
      const svg = generateWordCloud(
        text,
        maxWords,
        colors || DEFAULT_COLORS,
        width,
        height,
      );

      return {
        text: svg,
        mimeType: 'image/svg+xml',
        filename: 'word-cloud.svg',
      };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Word cloud generation failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
