interface ErrorEntry {
  id: string;
  toolName: string;
  error: string;
  stack?: string;
  timestamp: string;
  userAgent?: string;
  requestId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const errors: ErrorEntry[] = [];
const MAX_ERRORS = 1000;

export function captureError(params: {
  toolName: string;
  error: string;
  stack?: string;
  userAgent?: string;
  requestId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}): string {
  const id = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const entry: ErrorEntry = {
    id,
    toolName: params.toolName,
    error: params.error,
    stack: params.stack,
    timestamp: new Date().toISOString(),
    userAgent: params.userAgent,
    requestId: params.requestId,
    severity: params.severity || 'medium',
  };

  errors.unshift(entry);

  // Keep only recent errors
  if (errors.length > MAX_ERRORS) {
    errors.length = MAX_ERRORS;
  }

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ErrorMonitor] ${params.toolName}: ${params.error}`);
  }

  return id;
}

export function getErrors(params?: {
  toolName?: string;
  severity?: string;
  limit?: number;
  since?: string;
}): ErrorEntry[] {
  let filtered = errors;

  if (params?.toolName) {
    filtered = filtered.filter(e => e.toolName === params.toolName);
  }
  if (params?.severity) {
    filtered = filtered.filter(e => e.severity === params.severity);
  }
  if (params?.since) {
    const sinceDate = new Date(params.since).getTime();
    filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= sinceDate);
  }

  return filtered.slice(0, params?.limit || 50);
}

export function getErrorStats(): {
  total: number;
  bySeverity: Record<string, number>;
  byTool: Record<string, number>;
  recentCount: number; // last hour
} {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const bySeverity: Record<string, number> = {};
  const byTool: Record<string, number> = {};
  let recentCount = 0;

  for (const e of errors) {
    bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    byTool[e.toolName] = (byTool[e.toolName] || 0) + 1;
    if (new Date(e.timestamp).getTime() >= oneHourAgo) {
      recentCount++;
    }
  }

  return { total: errors.length, bySeverity, byTool, recentCount };
}
