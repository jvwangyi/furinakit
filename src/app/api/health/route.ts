import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
  uptime: number;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    uptime: process.uptime(),
  });
}
