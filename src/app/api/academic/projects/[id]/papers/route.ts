import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// POST /api/academic/projects/[id]/papers — add paper to project
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
    const { title, authors, year, abstract, url, doi, citationKey } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Paper title is required' },
        { status: 400 }
      );
    }

    const paper = await prisma.academicPaper.create({
      data: {
        projectId,
        title: title.trim(),
        authors: typeof authors === 'object' ? authors.join(', ') : (authors || null),
        year: year ? Number(year) : null,
        abstract: abstract || null,
        url: url || null,
        doi: doi || null,
        citationKey: citationKey || null,
      },
    });

    return NextResponse.json({ success: true, data: paper }, { status: 201 });
  } catch (error) {
    console.error('Failed to add paper:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add paper' },
      { status: 500 }
    );
  }
}

// DELETE /api/academic/projects/[id]/papers — remove paper from project
export async function DELETE(
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
    const { paperId, doi } = body;

    if (!paperId && !doi) {
      return NextResponse.json(
        { success: false, error: 'paperId or doi is required' },
        { status: 400 }
      );
    }

    // Verify paper belongs to this project
    const paper = await prisma.academicPaper.findFirst({
      where: {
        projectId,
        ...(paperId ? { id: paperId } : {}),
        ...(!paperId && doi ? { doi } : {}),
      },
    });

    if (!paper) {
      return NextResponse.json(
        { success: false, error: 'Paper not found in this project' },
        { status: 404 }
      );
    }

    await prisma.academicPaper.delete({ where: { id: paper.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove paper:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove paper' },
      { status: 500 }
    );
  }
}
