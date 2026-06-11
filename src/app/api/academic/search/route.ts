import { NextRequest, NextResponse } from 'next/server';
import { collectLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface SearchBody {
  query: string;
  sources?: string[];
  limit?: number;
  offset?: number;
  projectId?: string;
  llm?: LLMConfig;
}

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

// ─── Caches ───────────────────────────────────────────────────────────────────

const searchCache = new Map<string, { data: Paper[]; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

const expansionCache = new Map<string, { data: string[]; expires: number }>();
const EXPANSION_TTL = 30 * 60 * 1000; // 30 min

// Cache key excludes offset — we cache a larger batch and paginate client-side
function getSearchCacheKey(query: string, sources: string[]): string {
  return `${query}|${sources.sort().join(',')}`;
}

function getCached<T>(map: Map<string, { data: T; expires: number }>, key: string): T | null {
  const entry = map.get(key);
  if (entry && Date.now() < entry.expires) return entry.data;
  if (entry) map.delete(key);
  return null;
}

function setCache<T>(map: Map<string, { data: T; expires: number }>, key: string, data: T, ttl: number): void {
  map.set(key, { data, expires: Date.now() + ttl });
  if (map.size > 300) {
    const now = Date.now();
    for (const [k, v] of map) {
      if (now >= v.expires) map.delete(k);
    }
  }
}

// ─── Query Expansion ──────────────────────────────────────────────────────────

const EXPANSION_PROMPT = `You are an academic search assistant. Given a research query, generate 3-5 alternative search queries that would find related academic papers. Include synonyms, related concepts, and alternative phrasings used in the academic literature.

Output ONLY a JSON array of strings, nothing else. Each string should be a viable search query.

Example input: "tree skeleton extraction"
Example output: ["tree reconstruction", "plant structure extraction", "L-system tree modeling", "tree point cloud processing", "botanical structure analysis"]`;

async function expandQuery(query: string, llm?: LLMConfig): Promise<string[]> {
  // Check cache first
  const cached = getCached(expansionCache, query.toLowerCase());
  if (cached) return cached;

  // If no LLM config, return empty (no expansion)
  if (!llm?.apiKey) return [];

  try {
    const messages: Message[] = [
      { role: 'system', content: EXPANSION_PROMPT },
      { role: 'user', content: query },
    ];

    const result = await collectLLM(
      { ...llm, maxTokens: 512 },
      messages,
    );

    // Parse JSON array from response
    const jsonMatch = result.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as unknown;
      if (Array.isArray(parsed)) {
        const queries = parsed.filter((q): q is string => typeof q === 'string').slice(0, 5);
        setCache(expansionCache, query.toLowerCase(), queries, EXPANSION_TTL);
        return queries;
      }
    }
  } catch {
    // Expansion failure is non-fatal; fall back to original query
  }

  return [];
}

// ─── Semantic Scholar Search ──────────────────────────────────────────────────

const SEMANTIC_SCHOLAR_API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY || '';
console.log('[SS-API] Key loaded:', SEMANTIC_SCHOLAR_API_KEY ? `${SEMANTIC_SCHOLAR_API_KEY.substring(0,8)}... (${SEMANTIC_SCHOLAR_API_KEY.length} chars)` : 'EMPTY');

async function searchSemanticScholarWithRetry(query: string, limit: number, offset: number, maxRetries = 3): Promise<Paper[]> {
  // Extract English keywords for Semantic Scholar (it doesn't handle Chinese well)
  const englishWords = query.match(/[a-zA-Z]{2,}/g) || [];
  const ssQuery = englishWords.length > 0 ? englishWords.join(' ') : query;
  console.log(`[SS-API] Original query: ${query.substring(0, 50)}...`);
  console.log(`[SS-API] SS query: ${ssQuery}`);

  const params = new URLSearchParams({
    query: ssQuery,
    limit: String(limit),
    offset: String(offset),
    fields: 'title,authors,year,citationCount,url,abstract,externalIds,venue',
  });

  const headers: Record<string, string> = {
    'User-Agent': 'FurinaKit/1.0 (Academic Research Tool; https://github.com/furinakit)',
  };
  if (SEMANTIC_SCHOLAR_API_KEY) {
    headers['x-api-key'] = SEMANTIC_SCHOLAR_API_KEY;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?${params}`;
      console.log(`[SS-API] Requesting: ${url}`);
      console.log(`[SS-API] Headers:`, JSON.stringify(headers));
      const res = await fetch(url,
        { headers, signal: AbortSignal.timeout(15000) }
      );

      if (res.status === 429) {
        console.log(`[SS-API] Rate limited (429), attempt ${attempt + 1}/${maxRetries + 1}`);
        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt + 1) * 1000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        // All retries exhausted — return empty instead of throwing
        return [];
      }

      if (!res.ok) {
        console.log(`[SS-API] Error: ${res.status} ${res.statusText}`);
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt + 1) * 1000;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        return [];
      }

      const data = await res.json();
      console.log(`[SS-API] Status: ${res.status}, Papers: ${data.data?.length || 0}, Total: ${data.total || 0}, Error: ${data.message || 'none'}`);
      console.log(`[SS-API] Response keys: ${Object.keys(data).join(', ')}`);
      if (data.data?.length > 0) {
        console.log(`[SS-API] First paper: ${data.data[0].title}`);
      }
      const papers: Paper[] = (data.data || []).map((p: Record<string, unknown>) => {
        const extIds: Record<string, string | null> = (p.externalIds ?? {}) as Record<string, string | null>;
        const doi = extIds.DOI;
        return {
          title: p.title || 'Untitled',
          authors: Array.isArray(p.authors) ? p.authors.map((a: Record<string, string>) => a.name || 'Unknown') : [],
          year: p.year ?? null,
          citationCount: p.citationCount ?? 0,
          url: p.url || (doi ? `https://doi.org/${doi}` : ''),
          abstract: p.abstract ?? null,
          source: 'Semantic Scholar',
          externalIds: extIds,
          venue: (p.venue as string) ?? null,
          paperId: (p.paperId as string) ?? null,
        };
      });

      return papers;
    } catch {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return [];
    }
  }

  return [];
}

// ─── arXiv Search ─────────────────────────────────────────────────────────────

async function searchArXiv(query: string, maxResults: number): Promise<Paper[]> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    max_results: String(maxResults),
    sortBy: 'relevance',
    sortOrder: 'descending',
  });

  const res = await fetch(
    `http://export.arxiv.org/api/query?${params}`,
    {
      headers: { 'User-Agent': 'FurinaKit/1.0 (Academic Research Tool)' },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!res.ok) {
    throw new Error(`arXiv API error: ${res.status}`);
  }

  const xml = await res.text();
  return parseArxivXml(xml);
}

function parseArxivXml(xml: string): Paper[] {
  const papers: Paper[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];

    const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim() || 'Untitled';
    const summary = extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim() || null;
    const published = extractTag(entry, 'published');
    const year = published ? parseInt(published.substring(0, 4)) : null;

    const authors: string[] = [];
    const authorRegex = /<author>\s*<name>(.*?)<\/name>/g;
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    let url = '';
    const idTag = extractTag(entry, 'id');
    if (idTag) url = idTag;

    const doiRegex = /<arxiv:doi[^>]*>(.*?)<\/arxiv:doi>/;
    const doiMatch = doiRegex.exec(entry);
    const doi = doiMatch ? doiMatch[1].trim() : null;

    if (doi) {
      url = `https://doi.org/${doi}`;
    }

    // Extract arXiv paperId from the id URL
    const arxivIdMatch = url.match(/arxiv\.org\/abs\/(.+)$/);

    papers.push({
      title,
      authors,
      year,
      citationCount: 0,
      url,
      abstract: summary,
      source: 'arXiv',
      externalIds: doi ? { DOI: doi } : {},
      venue: 'arXiv',
      paperId: arxivIdMatch ? arxivIdMatch[1] : null,
    });
  }

  return papers;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1] : null;
}

// ─── Improved Dedup ───────────────────────────────────────────────────────────

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return 1;

  // Jaccard similarity on word sets
  const wordsA = new Set(na.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(nb.split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

function deduplicatePapers(papers: Paper[]): Paper[] {
  const groups: Paper[][] = [];

  for (const paper of papers) {
    let merged = false;
    for (const group of groups) {
      if (titleSimilarity(paper.title, group[0].title) >= 0.7) {
        group.push(paper);
        merged = true;
        break;
      }
    }
    if (!merged) {
      groups.push([paper]);
    }
  }

  // From each group, pick the best paper
  return groups.map(group => {
    return group.reduce((best, curr) => {
      // Prefer: more citations, has abstract, has paperId, from Semantic Scholar
      const bestScore = (best.citationCount > 0 ? 2 : 0) + (best.abstract ? 1 : 0) + (best.paperId ? 1 : 0) + (best.source === 'Semantic Scholar' ? 1 : 0);
      const currScore = (curr.citationCount > 0 ? 2 : 0) + (curr.abstract ? 1 : 0) + (curr.paperId ? 1 : 0) + (curr.source === 'Semantic Scholar' ? 1 : 0);
      return currScore > bestScore ? curr : best;
    });
  });
}

// ─── Relevance Sorting ────────────────────────────────────────────────────────

function relevanceScore(paper: Paper, query: string): number {
  const titleSim = titleSimilarity(paper.title, query);
  const citationScore = Math.log2(Math.max(paper.citationCount, 1) + 1) / 20; // normalize ~0-1
  const currentYear = new Date().getFullYear();
  const yearScore = paper.year ? Math.max(0, (paper.year - (currentYear - 10)) / 10) : 0.3;

  // Weighted combination
  return titleSim * 0.4 + citationScore * 0.35 + yearScore * 0.25;
}

function sortByRelevance(papers: Paper[], query: string): Paper[] {
  return papers.sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query));
}

// ─── API Route ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: SearchBody = await req.json();
    const { query, sources, limit = 20, offset = 0, llm } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    const selectedSources = sources && sources.length > 0 ? sources : ['semantic-scholar', 'arxiv'];
    const cacheKey = getSearchCacheKey(trimmedQuery, selectedSources);

    // Check cache (offset-independent key — we cache the full batch)
    const cached = getCached(searchCache, cacheKey);
    if (cached) {
      const sliced = cached.slice(offset, offset + limit);
      return NextResponse.json({ success: true, data: sliced, total: cached.length, cached: true, expandedQueries: [] });
    }

    // Query expansion (only on first page, not load-more)
    let expandedQueries: string[] = [];
    if (offset === 0 && llm?.apiKey) {
      expandedQueries = await expandQuery(trimmedQuery, llm);
    }

    const promises: Promise<Paper[]>[] = [];
    const errors: string[] = [];
    let semanticScholarFailed = false;

    // Search with original query — request a larger batch (up to 100) to cache
    const fetchLimit = Math.min(Math.max(limit + offset, 40), 100);

    if (selectedSources.includes('semantic-scholar')) {
      promises.push(
        searchSemanticScholarWithRetry(trimmedQuery, fetchLimit, 0).then(papers => {
          if (papers.length === 0) semanticScholarFailed = true;
          return papers;
        }).catch(() => {
          semanticScholarFailed = true;
          return [] as Paper[];
        })
      );
    }

    if (selectedSources.includes('arxiv')) {
      promises.push(
        searchArXiv(trimmedQuery, fetchLimit).catch((e) => {
          errors.push(`arXiv: ${e.message}`);
          return [] as Paper[];
        })
      );
    }

    // Also search expanded queries (with smaller limits to supplement)
    for (const eq of expandedQueries) {
      if (selectedSources.includes('semantic-scholar')) {
        promises.push(
          searchSemanticScholarWithRetry(eq, Math.min(5, 100), 0).catch(() => [] as Paper[])
        );
      }
    }

    const results = await Promise.all(promises);
    let allPapers = results.flat();

    // Deduplicate
    allPapers = deduplicatePapers(allPapers);

    // Sort by relevance
    allPapers = sortByRelevance(allPapers, trimmedQuery);

    // Cache the full sorted batch (not just the requested page)
    setCache(searchCache, cacheKey, allPapers, CACHE_TTL);

    // Slice for this response
    const limitedPapers = allPapers.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: limitedPapers,
      total: allPapers.length,
      expandedQueries,
      errors: errors.length > 0 ? errors : undefined,
      semanticScholarUnavailable: semanticScholarFailed && selectedSources.includes('semantic-scholar'),
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
