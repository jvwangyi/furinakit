import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  paragraphs: z.number().int().min(1).max(20).default(3),
  sentencesPerParagraph: z.number().int().min(1).max(20).default(4),
});

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'semper', 'risus',
  'viverra', 'maecenas', 'accumsan', 'lacus', 'vel', 'facilisis', 'volutpat',
  'vitae', 'sapien', 'pellentesque', 'habitant', 'morbi', 'tristique', 'senectus',
  'netus', 'fames', 'turpis', 'egestas', 'mauris', 'pharetra', 'convallis',
  'posuere', 'orci', 'laoreet', 'suspendisse', 'interdum', 'varius', 'natoque',
  'penatibus', 'magnis', 'dis', 'parturient', 'montes', 'nascetur', 'ridiculus',
  'mus', 'donec', 'feugiat', 'metus', 'vulputate', 'eu', 'scelerisque', 'felis',
  'imperdiet', 'proin', 'fermentum', 'leo', 'vel', 'porta', 'consequat', 'nec',
  'sagittis', 'aliquam', 'fringilla', 'ullamcorper', 'odio', 'lobortis', 'massa',
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(): string {
  const length = 8 + Math.floor(Math.random() * 12);
  const words: string[] = [];
  for (let i = 0; i < length; i++) {
    words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  words[0] = capitalize(words[0]);
  return words.join(' ') + '.';
}

function generateParagraph(sentences: number): string {
  const result: string[] = [];
  for (let i = 0; i < sentences; i++) {
    result.push(generateSentence());
  }
  return result.join(' ');
}

const tool: Tool = {
  name: 'lorem-gen',
  description: 'Generate Lorem Ipsum placeholder text',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { paragraphs, sentencesPerParagraph } = inputSchema.parse(input);

    const result: string[] = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(generateParagraph(sentencesPerParagraph));
    }

    return {
      text: JSON.stringify({
        paragraphs,
        sentencesPerParagraph,
        text: result.join('\n\n'),
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
