import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  text: z.string(),
});

interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
}

const tool: Tool = {
  name: 'text-count',
  description: 'Count characters, words, lines, sentences, and paragraphs in text',
  category: 'text',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { text } = inputSchema.parse(input);

    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;

    // Words: split by whitespace, filter empty
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    // Lines
    const lines = text === '' ? 0 : text.split('\n').length;

    // Sentences: split by sentence-ending punctuation
    const sentences = text.trim() === ''
      ? 0
      : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Paragraphs: split by double newline or more
    const paragraphs = text.trim() === ''
      ? 0
      : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    const stats: TextStats = {
      characters,
      charactersNoSpaces,
      words,
      lines,
      sentences,
      paragraphs,
    };

    return { text: JSON.stringify(stats, null, 2) };
  },
};

register(tool);
export default tool;
