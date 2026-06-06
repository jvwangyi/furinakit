import { z } from 'zod';

/** Lightweight tool metadata for client-side display (name, description, category only) */
export interface ToolInfo {
  name: string;
  description: string;
  category: string;
}

/** Result returned by tool execution (server-side) */
export interface ToolResult {
  data?: Buffer | string;
  text?: string;
  mimeType?: string;
  filename?: string;
  /** Progress tracking ID for long-running operations */
  progressId?: string;
}

/** Full tool definition with schema and execute function */
export interface Tool {
  name: string;
  description: string;
  category: 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'dev' | 'convert' | 'file' | 'craft';
  inputSchema: z.ZodSchema;
  /** Input is typed as `any` because zod parse() handles validation inside execute */
  execute: (input: any) => Promise<ToolResult>;
}

/** Tool execution result as returned via API JSON response (client-side) */
export interface ToolApiResult {
  text?: string;
  /** Base64-encoded file data when result is a file */
  data?: string;
  mimeType?: string;
  filename?: string;
  downloadUrl?: string;
  size?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
