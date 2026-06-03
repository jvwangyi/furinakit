import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  minute: z.string().default('*'),
  hour: z.string().default('*'),
  dayOfMonth: z.string().default('*'),
  month: z.string().default('*'),
  dayOfWeek: z.string().default('*'),
});

const MINUTE_LABELS: Record<string, string> = {
  '*': 'every minute',
};
const HOUR_LABELS: Record<string, string> = {
  '*': 'every hour',
};
const DAY_LABELS: Record<string, string> = {
  '*': 'every day',
};
const MONTH_LABELS: Record<string, string> = {
  '*': 'every month',
};
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function describeField(value: string, labels: Record<string, string>, unit: string, names?: string[]): string {
  if (labels[value]) return labels[value];
  if (value === '*') return `every ${unit}`;

  // */N pattern
  const everyMatch = value.match(/^\*\/(\d+)$/);
  if (everyMatch) return `every ${everyMatch[1]} ${unit}s`;

  // N-M range
  const rangeMatch = value.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    if (names) {
      return `${names[+rangeMatch[1]] || rangeMatch[1]} through ${names[+rangeMatch[2]] || rangeMatch[2]}`;
    }
    return `${unit} ${rangeMatch[1]} through ${rangeMatch[2]}`;
  }

  // Comma list
  if (value.includes(',')) {
    const parts = value.split(',').map(v => {
      if (names && !isNaN(+v)) return names[+v] || v;
      return v;
    });
    return `${unit} ${parts.join(', ')}`;
  }

  // Specific value
  if (names && !isNaN(+value)) return `${names[+value] || value}`;
  return `${unit} ${value}`;
}

function describeCron(min: string, hr: string, dom: string, mon: string, dow: string): string {
  const parts: string[] = [];

  const minDesc = describeField(min, MINUTE_LABELS, 'minute');
  const hrDesc = describeField(hr, HOUR_LABELS, 'hour');
  const domDesc = describeField(dom, DAY_LABELS, 'day of month');
  const monDesc = describeField(mon, MONTH_LABELS, 'month');
  const dowDesc = describeField(dow, {}, 'day of week', WEEKDAY_NAMES);

  // Build a readable sentence
  let schedule = 'Runs';

  if (min !== '*' && hr !== '*') {
    schedule += ` at ${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
  } else if (min.startsWith('*/')) {
    schedule += ` ${minDesc}`;
    if (hr !== '*') schedule += ` during hour ${hrDesc}`;
  } else if (hr.startsWith('*/')) {
    schedule += ` ${hrDesc}`;
  } else {
    schedule += ` ${minDesc}`;
    if (hr !== '*') schedule += ` past ${hrDesc}`;
  }

  if (dom !== '*') schedule += ` on ${domDesc}`;
  if (mon !== '*') schedule += ` in ${monDesc}`;
  if (dow !== '*') schedule += ` on ${dowDesc}`;

  schedule += '.';
  return schedule;
}

const tool: Tool = {
  name: 'cron-gen',
  description: 'Generate cron expressions from field values with human-readable descriptions',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = inputSchema.parse(input);

    const expression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
    const description = describeCron(minute, hour, dayOfMonth, month, dayOfWeek);

    return {
      text: JSON.stringify({ expression, description }, null, 2),
    };
  },
};

register(tool);
export default tool;
