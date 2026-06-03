import { Tool, ToolResult } from '../types/tool';

export type { Tool, ToolResult };

const tools = new Map<string, Tool>();

export function register(tool: Tool) {
  tools.set(tool.name, tool);
}

export function getTool(name: string): Tool | undefined {
  return tools.get(name);
}

export function getAllTools(): Tool[] {
  return Array.from(tools.values());
}

export function getToolsByCategory(category: string): Tool[] {
  return getAllTools().filter(t => t.category === category);
}
