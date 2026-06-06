import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  spec: z.string().min(1), // JSON or YAML OpenAPI spec
});

interface EndpointInfo {
  method: string;
  path: string;
  summary: string;
  tags: string[];
  parameters: string[];
  responses: string[];
}

function parseOpenAPISpec(specText: string): {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: EndpointInfo[];
  schemas: string[];
} {
  let spec: any;
  try {
    spec = JSON.parse(specText);
  } catch {
    throw new Error('Invalid JSON. YAML support requires structured JSON input.');
  }

  const info = spec.info || {};
  const title = info.title || 'Untitled API';
  const version = info.version || 'unknown';
  const description = info.description || '';

  // Base URL
  let baseUrl = '';
  if (spec.servers && spec.servers.length > 0) {
    baseUrl = spec.servers[0].url || '';
  } else if (spec.host) {
    const scheme = (spec.schemes && spec.schemes[0]) || 'https';
    const basePath = spec.basePath || '';
    baseUrl = `${scheme}://${spec.host}${basePath}`;
  }

  // Parse endpoints
  const endpoints: EndpointInfo[] = [];
  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    if (typeof methods !== 'object' || methods === null) continue;

    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: details.summary || details.description || '',
          tags: details.tags || [],
          parameters: (details.parameters || []).map((p: any) => `${p.name} (${p.in})`),
          responses: Object.keys(details.responses || {}),
        });
      }
    }
  }

  // Parse schemas
  const schemas: string[] = [];
  const definitions = spec.components?.schemas || spec.definitions || {};
  for (const name of Object.keys(definitions)) {
    schemas.push(name);
  }

  return { title, version, description, baseUrl, endpoints, schemas };
}

const tool: Tool = {
  name: 'openapi-viewer',
  description: 'Parse and display OpenAPI/Swagger specifications',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { spec } = inputSchema.parse(input);

    try {
      const result = parseOpenAPISpec(spec);
      return { text: JSON.stringify(result, null, 2) };
    } catch (err: any) {
      return { text: JSON.stringify({ error: err.message || 'Failed to parse OpenAPI spec' }) };
    }
  },
};

register(tool);
export default tool;
