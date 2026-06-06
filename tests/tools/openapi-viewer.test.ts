import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/openapi-viewer';

describe('openapi-viewer', () => {
  it('should parse OpenAPI 3.0 spec', async () => {
    const result = await tool.execute({
      spec: JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0', description: 'A test API' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/users': {
            get: { summary: 'List users', tags: ['users'], parameters: [], responses: { '200': {} } },
            post: { summary: 'Create user', tags: ['users'], parameters: [], responses: { '201': {} } },
          },
          '/users/{id}': {
            get: { summary: 'Get user', tags: ['users'], parameters: [{ name: 'id', in: 'path' }], responses: { '200': {} } },
          },
        },
        components: { schemas: { User: {} } },
      }),
    });
    const data = JSON.parse(result.text!);
    expect(data.title).toBe('Test API');
    expect(data.version).toBe('1.0.0');
    expect(data.baseUrl).toBe('https://api.example.com');
    expect(data.endpoints).toHaveLength(3);
    expect(data.endpoints[0].method).toBe('GET');
    expect(data.endpoints[0].path).toBe('/users');
    expect(data.schemas).toContain('User');
  });

  it('should parse Swagger 2.0 spec', async () => {
    const result = await tool.execute({
      spec: JSON.stringify({
        swagger: '2.0',
        info: { title: 'Legacy API', version: '0.1' },
        host: 'api.old.com',
        basePath: '/v1',
        schemes: ['https'],
        paths: {
          '/items': { get: { summary: 'List items' } },
        },
      }),
    });
    const data = JSON.parse(result.text!);
    expect(data.title).toBe('Legacy API');
    expect(data.baseUrl).toBe('https://api.old.com/v1');
    expect(data.endpoints).toHaveLength(1);
  });

  it('should return error for invalid JSON', async () => {
    const result = await tool.execute({ spec: 'not json' });
    const data = JSON.parse(result.text!);
    expect(data.error).toBeDefined();
  });
});
