import { NextRequest, NextResponse } from 'next/server';

interface VerifyBody {
  citations: string[];
}

interface VerifyResult {
  citation: string;
  valid: boolean;
  paper?: {
    title: string;
    authors: string[];
    year: number | null;
    url: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: VerifyBody = await req.json();
    const { citations } = body;

    if (!Array.isArray(citations) || citations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'citations array is required' },
        { status: 400 }
      );
    }

    if (citations.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 citations per request' },
        { status: 400 }
      );
    }

    const results: VerifyResult[] = [];

    // Process citations in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < citations.length; i += batchSize) {
      const batch = citations.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (citation): Promise<VerifyResult> => {
          try {
            // Check if it looks like a DOI
            const isDoi = /^10\.\d{4,}\//.test(citation);

            let searchUrl: string;
            if (isDoi) {
              searchUrl = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(citation)}?fields=title,authors,year,url`;
            } else {
              // Search by title
              const params = new URLSearchParams({
                query: citation,
                limit: '1',
                fields: 'title,authors,year,url',
              });
              searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?${params}`;
            }

            const res = await fetch(searchUrl, {
              headers: { 'User-Agent': 'FurinaKit/1.0 (Academic Research Tool)' },
              signal: AbortSignal.timeout(10000),
            });

            if (res.status === 429) {
              // Rate limited — return as "unknown" rather than failing
              return { citation, valid: false };
            }

            if (!res.ok) {
              return { citation, valid: false };
            }

            const data = await res.json();

            // For DOI lookup, data is the paper directly
            // For search, data.data is an array
            let paper: Record<string, unknown> | null = null;
            if (isDoi && data.paperId) {
              paper = data;
            } else if (data.data && data.data.length > 0) {
              paper = data.data[0];
            }

            if (paper) {
              return {
                citation,
                valid: true,
                paper: {
                  title: (paper.title as string) || 'Untitled',
                  authors: Array.isArray(paper.authors)
                    ? (paper.authors as Array<Record<string, string>>).map((a) => a.name || 'Unknown')
                    : [],
                  year: (paper.year as number) ?? null,
                  url: (paper.url as string) || '',
                },
              };
            }

            return { citation, valid: false };
          } catch {
            return { citation, valid: false };
          }
        })
      );

      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < citations.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({ success: true, results });
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
