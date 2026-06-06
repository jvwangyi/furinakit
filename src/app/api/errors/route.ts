import { NextRequest, NextResponse } from 'next/server';
import { getErrors, getErrorStats } from '@/lib/error-monitor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stats = searchParams.get('stats');

  if (stats === 'true') {
    return NextResponse.json({ success: true, data: getErrorStats() });
  }

  const errors = getErrors({
    toolName: searchParams.get('tool') || undefined,
    severity: searchParams.get('severity') || undefined,
    limit: parseInt(searchParams.get('limit') || '50'),
    since: searchParams.get('since') || undefined,
  });

  return NextResponse.json({ success: true, data: errors });
}
