import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  token: z.string().optional(),
  text: z.string().optional(),
});

function base64UrlDecode(str: string): string {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

const tool: Tool = {
  name: 'jwt-decode',
  description: 'Decode JWT token without signature verification',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { token, text } = inputSchema.parse(input);
    const jwtToken = token || text;

    if (!jwtToken) {
      throw new ToolError(ErrorCode.MISSING_REQUIRED, 'Token is required');
    }

    try {
      const parts = jwtToken.split('.');

      if (parts.length !== 3) {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid JWT format: expected 3 parts');
      }

      const [headerB64, payloadB64, signature] = parts;

      let header: unknown;
      let payload: unknown;

      try {
        header = JSON.parse(base64UrlDecode(headerB64));
      } catch {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid JWT header');
      }

      try {
        payload = JSON.parse(base64UrlDecode(payloadB64));
      } catch {
        throw new ToolError(ErrorCode.INVALID_INPUT, 'Invalid JWT payload');
      }

      const result = {
        header,
        payload,
        signature,
      };

      return { text: JSON.stringify(result, null, 2) };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `Failed to decode JWT: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
