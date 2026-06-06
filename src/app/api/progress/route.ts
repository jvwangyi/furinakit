import { NextResponse } from 'next/server';
import { getAllProgress } from '@/lib/progress';

export const dynamic = 'force-dynamic';

export async function GET() {
  const all = getAllProgress();
  return NextResponse.json({ success: true, data: all });
}
