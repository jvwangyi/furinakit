import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  userAgent: z.string().min(1),
});

interface ParsedUA {
  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: { type: string; vendor: string; model: string };
  engine: { name: string; version: string };
}

function parseUserAgent(ua: string): ParsedUA {
  const result: ParsedUA = {
    browser: { name: 'Unknown', version: '' },
    os: { name: 'Unknown', version: '' },
    device: { type: 'desktop', vendor: '', model: '' },
    engine: { name: 'Unknown', version: '' },
  };

  // Browser detection
  const browserPatterns = [
    { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/([\d.]+)/ },
    { name: 'Chrome', pattern: /Chrome\/([\d.]+)/ },
    { name: 'Firefox', pattern: /Firefox\/([\d.]+)/ },
    { name: 'Safari', pattern: /Version\/([\d.]+).*Safari/ },
    { name: 'Opera', pattern: /(?:OPR|Opera)\/([\d.]+)/ },
    { name: 'IE', pattern: /(?:MSIE |Trident\/.*rv:)([\d.]+)/ },
  ];

  for (const { name, pattern } of browserPatterns) {
    const match = ua.match(pattern);
    if (match) {
      result.browser = { name, version: match[1] };
      break;
    }
  }

  // OS detection
  const osPatterns = [
    { name: 'Windows', pattern: /Windows NT ([\d.]+)/ },
    { name: 'macOS', pattern: /Mac OS X ([\d_]+)/ },
    { name: 'iOS', pattern: /(?:iPhone|iPad).*OS ([\d_]+)/ },
    { name: 'Android', pattern: /Android ([\d.]+)/ },
    { name: 'Linux', pattern: /Linux/ },
    { name: 'Chrome OS', pattern: /CrOS/ },
  ];

  for (const { name, pattern } of osPatterns) {
    const match = ua.match(pattern);
    if (match) {
      result.os = {
        name,
        version: match[1]?.replace(/_/g, '.') || '',
      };
      break;
    }
  }

  // Device type detection
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    result.device.type = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) {
    result.device.type = 'tablet';
  }

  // Engine detection
  if (/AppleWebKit/.test(ua)) {
    result.engine.name = 'Blink';
    const match = ua.match(/AppleWebKit\/([\d.]+)/);
    if (match) result.engine.version = match[1];
  } else if (/Gecko/.test(ua)) {
    result.engine.name = 'Gecko';
    const match = ua.match(/Gecko\/([\d]+)/);
    if (match) result.engine.version = match[1];
  } else if (/Trident/.test(ua)) {
    result.engine.name = 'Trident';
    const match = ua.match(/Trident\/([\d.]+)/);
    if (match) result.engine.version = match[1];
  }

  return result;
}

const tool: Tool = {
  name: 'user-agent-parser',
  description: 'Parse User-Agent strings to identify browser, OS, and device info',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { userAgent } = inputSchema.parse(input);

    const parsed = parseUserAgent(userAgent);

    return {
      text: JSON.stringify({
        userAgent,
        ...parsed,
      }, null, 2),
    };
  },
};

register(tool);
export default tool;
