import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
  responseTime: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const start = Date.now();

  const mem = process.memoryUsage();

  const checks: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    memory: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
    },
    responseTime: Date.now() - start + 'ms',
  };

  return NextResponse.json(checks, { status: 200 });
}
