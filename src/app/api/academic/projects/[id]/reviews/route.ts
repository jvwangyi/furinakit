import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// POST /api/academic/projects/[id]/reviews — save review/assessment result
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    // Verify project belongs to user
    const project = await prisma.academicProject.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, content, config, score, verdict } = body;

    if (!type || !['literature_review', 'peer_review', 'integrity_check', 'revision', 'writing', 'rq_brief'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid review type. Must be "literature_review", "peer_review", "integrity_check", "revision", "writing", or "rq_brief"' },
        { status: 400 }
      );
    }

    // Determine stage from type if not explicitly provided
    const stageMap: Record<string, string> = {
      literature_review: 'literature_review',
      peer_review: 'peer_review',
      integrity_check: 'integrity_check',
      revision: 'revision',
      writing: 'writing',
      rq_brief: 'rq_brief',
    };
    const reviewStage = body.stage || stageMap[type] || type;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Review content is required' },
        { status: 400 }
      );
    }

    // Try to find an existing review of the same type/stage for this project
    const existing = await prisma.academicReview.findFirst({
      where: { projectId, type, stage: reviewStage },
      orderBy: { createdAt: 'desc' },
    });

    let review;
    if (existing) {
      // Update existing review
      review = await prisma.academicReview.update({
        where: { id: existing.id },
        data: {
          content: content.trim(),
          config: config ? JSON.stringify(config) : null,
          score: score ? Number(score) : null,
          verdict: verdict || null,
        },
      });
    } else {
      // Create new review
      review = await prisma.academicReview.create({
        data: {
          projectId,
          stage: reviewStage,
          type,
          content: content.trim(),
          config: config ? JSON.stringify(config) : null,
          score: score ? Number(score) : null,
          verdict: verdict || null,
        },
      });
    }

    return NextResponse.json({ success: true, data: review }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Failed to save review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save review' },
      { status: 500 }
    );
  }
}

// GET /api/academic/projects/[id]/reviews — list reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    const project = await prisma.academicProject.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const reviews = await prisma.academicReview.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
