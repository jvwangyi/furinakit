import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  data: z.string().min(1),      // JSON string to validate
  schema: z.string().min(1),    // JSON Schema string
});

interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

function validateAgainstSchema(data: any, schema: any, path: string = '$'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!schema || typeof schema !== 'object') return errors;

  // Type checking
  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];

    if (!expectedTypes.includes(actualType) && !(actualType === 'number' && expectedTypes.includes('integer') && Number.isInteger(data))) {
      errors.push({
        path,
        message: `Expected type "${expectedTypes.join(' | ')}", got "${actualType}"`,
        value: data,
      });
      return errors; // Stop further validation if type is wrong
    }
  }

  // Required properties
  if (schema.required && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const prop of schema.required) {
      if (!(prop in data)) {
        errors.push({
          path: `${path}`,
          message: `Missing required property: "${prop}"`,
        });
      }
    }
  }

  // Properties validation
  if (schema.properties && typeof data === 'object' && data !== null && !Array.isArray(data)) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in data) {
        errors.push(...validateAgainstSchema(data[key], propSchema, `${path}.${key}`));
      }
    }
  }

  // Array items validation
  if (schema.items && Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      errors.push(...validateAgainstSchema(data[i], schema.items, `${path}[${i}]`));
    }
  }

  // Minimum / Maximum
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({ path, message: `Value ${data} is less than minimum ${schema.minimum}`, value: data });
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({ path, message: `Value ${data} is greater than maximum ${schema.maximum}`, value: data });
    }
  }

  // String length
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({ path, message: `String length ${data.length} is less than minLength ${schema.minLength}` });
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({ path, message: `String length ${data.length} is greater than maxLength ${schema.maxLength}` });
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push({ path, message: `String does not match pattern: ${schema.pattern}` });
    }
  }

  // Enum
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({ path, message: `Value must be one of: ${schema.enum.join(', ')}`, value: data });
  }

  // const
  if (schema.const !== undefined && data !== schema.const) {
    errors.push({ path, message: `Value must be: ${JSON.stringify(schema.const)}`, value: data });
  }

  return errors;
}

const tool: Tool = {
  name: 'json-schema-validate',
  description: 'Validate JSON data against a JSON Schema',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { data, schema } = inputSchema.parse(input);

    try {
      const parsedData = JSON.parse(data);
      const parsedSchema = JSON.parse(schema);

      const errors = validateAgainstSchema(parsedData, parsedSchema);

      return {
        text: JSON.stringify({
          valid: errors.length === 0,
          errors,
          summary: errors.length === 0
            ? 'Data is valid against the schema'
            : `Found ${errors.length} validation error(s)`,
        }, null, 2),
      };
    } catch (err: any) {
      return { text: JSON.stringify({ error: err.message || 'Validation failed' }) };
    }
  },
};

register(tool);
export default tool;
