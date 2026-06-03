import { NextRequest, NextResponse } from 'next/server';
import { recordToolUsage, getStats } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolName } = body;

    if (!toolName || typeof toolName !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'toolName is required' } },
        { status: 400 }
      );
    }

    const usage = await recordToolUsage(toolName);
    return NextResponse.json({ success: true, data: usage });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const stats = await getStats(limit);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
