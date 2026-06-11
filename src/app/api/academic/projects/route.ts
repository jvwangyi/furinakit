import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET /api/academic/projects — list all projects for current user
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = await prisma.academicProject.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            papers: true,
            reviews: true,
            drafts: true,
          },
        },
        reviews: {
          select: { type: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Compute per-type review counts
    const data = projects.map((p) => {
      const reviewCounts: Record<string, number> = {};
      for (const r of p.reviews) {
        reviewCounts[r.type] = (reviewCounts[r.type] || 0) + 1;
      }
      const { reviews: _ignored, ...rest } = p as any;
      return { ...rest, reviewCounts };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/academic/projects — create a new project
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, topic } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await prisma.academicProject.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        topic: topic?.trim() || null,
        stage: 'brainstorm',
      },
      include: {
        _count: {
          select: {
            papers: true,
            reviews: true,
            drafts: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
