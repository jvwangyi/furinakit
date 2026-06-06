import { NextResponse } from 'next/server';
import { getProgress } from '@/lib/progress';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const progress = getProgress(id);

  if (!progress) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Progress not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: progress });
}
