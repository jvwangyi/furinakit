import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/academic/projects/[id]/drafts — list drafts
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

    const drafts = await prisma.academicDraft.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: drafts });
  } catch (error) {
    console.error('Failed to fetch drafts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// POST /api/academic/projects/[id]/drafts — create a new draft
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
    const { title, content } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Draft title is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Draft content is required' },
        { status: 400 }
      );
    }

    const draft = await prisma.academicDraft.create({
      data: {
        projectId,
        title: title.trim(),
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true, data: draft }, { status: 201 });
  } catch (error) {
    console.error('Failed to create draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
