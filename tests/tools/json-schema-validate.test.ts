import { describe, it, expect } from 'vitest';
import tool from '@/lib/tools/json-schema-validate';

describe('json-schema-validate', () => {
  it('should validate valid data', async () => {
    const result = await tool.execute({
      data: JSON.stringify({ name: 'John', age: 30 }),
      schema: JSON.stringify({
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
      }),
    });
    const data = JSON.parse(result.text!);
    expect(data.valid).toBe(true);
    expect(data.errors).toHaveLength(0);
  });

  it('should catch missing required fields', async () => {
    const result = await tool.execute({
      data: JSON.stringify({ name: 'John' }),
      schema: JSON.stringify({
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }),
    });
    const data = JSON.parse(result.text!);
    expect(data.valid).toBe(false);
    expect(data.errors.length).toBeGreaterThan(0);
    expect(data.errors[0].message).toContain('Missing required property');
  });

  it('should catch type mismatches', async () => {
    const result = await tool.execute({
      data: JSON.stringify({ name: 123 }),
      schema: JSON.stringify({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }),
    });
    const data = JSON.parse(result.text!);
    expect(data.valid).toBe(false);
  });

  it('should validate array items', async () => {
    const result = await tool.execute({
      data: JSON.stringify([1, 2, 'three']),
      schema: JSON.stringify({
        type: 'array',
        items: { type: 'number' },
      }),
    });
    const data = JSON.parse(result.text!);
    expect(data.valid).toBe(false);
  });
});
