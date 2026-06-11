import { NextRequest, NextResponse } from 'next/server';

interface Paper {
  title: string;
  authors: string[];
  year: number | null;
  citationCount: number;
  url: string;
  abstract: string | null;
  source: string;
  externalIds?: Record<string, string | null>;
  venue?: string | null;
  paperId?: string | null;
}

const SS_FIELDS = 'title,authors,year,citationCount,url,abstract,externalIds,venue';

async function fetchRelatedPapers(paperId: string): Promise<{ citations: Paper[]; references: Paper[] }> {
  const headers = { 'User-Agent': 'FurinaKit/1.0 (Academic Research Tool)' };
  const timeout = 15000;

  const [citationsRes, referencesRes] = await Promise.allSettled([
    fetch(
      `https://api.semanticscholar.org/graph/v1/paper/${paperId}/citations?fields=${SS_FIELDS}&limit=20`,
      { headers, signal: AbortSignal.timeout(timeout) }
    ),
    fetch(
      `https://api.semanticscholar.org/graph/v1/paper/${paperId}/references?fields=${SS_FIELDS}&limit=20`,
      { headers, signal: AbortSignal.timeout(timeout) }
    ),
  ]);

  const mapPaper = (p: Record<string, unknown>): Paper | null => {
    const paper = (p.citingPaper || p.citedPaper || p) as Record<string, unknown>;
    if (!paper.title || paper.title === 'MISSING') return null;
    const extIds = (paper.externalIds ?? {}) as Record<string, string | null>;
    const doi = extIds?.DOI;
    return {
      title: paper.title as string,
      authors: Array.isArray(paper.authors) ? (paper.authors as Array<Record<string, string>>).map(a => a.name || 'Unknown') : [],
      year: paper.year as number | null ?? null,
      citationCount: paper.citationCount as number ?? 0,
      url: (paper.url as string) || (doi ? `https://doi.org/${doi}` : ''),
      abstract: (paper.abstract as string) ?? null,
      source: 'Semantic Scholar',
      externalIds: extIds,
      venue: (paper.venue as string) ?? null,
      paperId: (paper.paperId as string) ?? null,
    };
  };

  let citations: Paper[] = [];
  if (citationsRes.status === 'fulfilled' && citationsRes.value.ok) {
    const data = await citationsRes.value.json();
    citations = (data.data || [])
      .map((item: Record<string, unknown>) => mapPaper(item))
      .filter((p: Paper | null): p is Paper => p !== null);
  }

  let references: Paper[] = [];
  if (referencesRes.status === 'fulfilled' && referencesRes.value.ok) {
    const data = await referencesRes.value.json();
    references = (data.data || [])
      .map((item: Record<string, unknown>) => mapPaper(item))
      .filter((p: Paper | null): p is Paper => p !== null);
  }

  // Sort both by citation count
  citations.sort((a, b) => b.citationCount - a.citationCount);
  references.sort((a, b) => b.citationCount - a.citationCount);

  return { citations, references };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paperId } = body;

    if (!paperId || typeof paperId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'paperId is required' },
        { status: 400 }
      );
    }

    const result = await fetchRelatedPapers(paperId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
