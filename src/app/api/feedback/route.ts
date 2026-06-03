import { NextRequest, NextResponse } from 'next/server';
import { addFeedback, getFeedbacks } from '@/lib/feedback';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toolName, rating, comment } = body;

    if (!toolName || typeof toolName !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'toolName is required' } },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'rating must be 1-5' } },
        { status: 400 }
      );
    }

    const feedback = await addFeedback({ toolName, rating, comment });
    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const toolName = req.nextUrl.searchParams.get('toolName') || undefined;
    const feedbacks = await getFeedbacks(toolName);
    return NextResponse.json({ success: true, data: feedbacks });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
