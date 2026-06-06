export interface ToolStats {
  name: string;
  totalRequests: number;
  lastUsedAt: string | null;
}

const stats = new Map<string, ToolStats>();

export function recordToolUsage(toolName: string): ToolStats {
  let entry = stats.get(toolName);
  if (!entry) {
    entry = { name: toolName, totalRequests: 0, lastUsedAt: null };
    stats.set(toolName, entry);
  }
  entry.totalRequests++;
  entry.lastUsedAt = new Date().toISOString();
  return entry;
}

export function getToolStats(toolName?: string): ToolStats[] {
  if (toolName) {
    const entry = stats.get(toolName);
    return entry ? [entry] : [];
  }
  return Array.from(stats.values()).sort((a, b) => b.totalRequests - a.totalRequests);
}

export function getTopTools(limit: number = 10): ToolStats[] {
  return getToolStats().slice(0, limit);
}
