import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  expression: z.string().min(1),
  count: z.number().int().min(1).max(20).default(5),
});

function parseField(field: string, min: number, max: number): number[] {
  const values = new Set<number>();

  for (const part of field.split(',')) {
    // Handle step: */N or N-M/S
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const step = stepMatch ? +stepMatch[2] : 1;
    const base = stepMatch ? stepMatch[1] : part;

    if (base === '*') {
      for (let v = min; v <= max; v += step) values.add(v);
    } else if (base.includes('-')) {
      const [start, end] = base.split('-').map(Number);
      for (let v = start; v <= end; v += step) values.add(v);
    } else {
      values.add(+base);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

function getNextExecutions(expression: string, count: number): string[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error('Invalid cron expression: expected 5 fields');

  const [minField, hourField, domField, monField, dowField] = parts;

  const minutes = parseField(minField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const doms = parseField(domField, 1, 31);
  const months = parseField(monField, 1, 12);
  const dows = parseField(dowField, 0, 6);

  const results: string[] = [];
  const now = new Date();
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

  const maxIterations = 525960; // ~1 year in minutes
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const m = cursor.getMinutes();
    const h = cursor.getHours();
    const dom = cursor.getDate();
    const mon = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    if (
      minutes.includes(m) &&
      hours.includes(h) &&
      doms.includes(dom) &&
      months.includes(mon) &&
      dows.includes(dow)
    ) {
      results.push(cursor.toISOString());
    }

    cursor = new Date(cursor.getTime() + 60000);
  }

  return results;
}

const tool: Tool = {
  name: 'cron-parser',
  description: 'Parse a cron expression and show next N execution times',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { expression, count } = inputSchema.parse(input);

    try {
      const nextRuns = getNextExecutions(expression, count);

      return {
        text: JSON.stringify({ expression, nextRuns }, null, 2),
      };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, `Cron parse failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
