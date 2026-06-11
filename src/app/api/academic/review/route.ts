import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface PaperInput {
  title: string;
  authors: string;
  year: number;
  abstract: string;
}

interface ReviewBody {
  topic: string;
  papers?: PaperInput[];
  style?: 'apa' | 'ieee' | 'gb';
  language?: 'zh' | 'en';
  llm: LLMConfig;
  styleProfile?: string;
}

const STYLE_INSTRUCTIONS: Record<string, string> = {
  apa: 'Use APA citation style (Author, Year). Format references in APA 7th edition.',
  ieee: 'Use IEEE citation style [1], [2], etc. Format references in IEEE numbered style.',
  gb: 'Use GB/T 7714 citation style (Author Year). Format references following Chinese national standard GB/T 7714-2015.',
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: '请用中文撰写综述。保持学术严谨性，使用规范的中文学术表达。',
  en: 'Write the review in English. Maintain academic rigor and use formal academic language.',
};

export async function POST(req: NextRequest) {
  try {
    const body: ReviewBody = await req.json();
    const { topic, papers, style = 'apa', language = 'zh', llm, styleProfile } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'topic is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration (provider + apiKey) is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // If no papers provided, auto-search via Semantic Scholar
    let paperList = papers;
    if (!paperList || paperList.length === 0) {
      try {
        const params = new URLSearchParams({
          query: topic.trim(),
          limit: '20',
          fields: 'title,authors,year,abstract',
        });
        const searchRes = await fetch(
          `https://api.semanticscholar.org/graph/v1/paper/search?${params}`,
          {
            headers: { 'User-Agent': 'FurinaKit/1.0 (Academic Research Tool)' },
            signal: AbortSignal.timeout(15000),
          },
        );
        if (searchRes.ok) {
          const data = await searchRes.json() as { data?: Array<Record<string, unknown>> };
          paperList = (data.data || []).map((p) => ({
            title: (p.title as string) || 'Untitled',
            authors: Array.isArray(p.authors)
              ? (p.authors as Array<Record<string, string>>).map((a) => a.name).join(', ')
              : 'Unknown',
            year: (p.year as number) || 0,
            abstract: (p.abstract as string) || '',
          }));
        }
      } catch {
        // If search fails, continue with empty list — LLM will generate from topic alone
      }
    }

    // Build paper list text for the prompt
    const paperListText = (paperList || [])
      .map(
        (p, i) =>
          `[${i + 1}] ${p.title} (${p.year})\nAuthors: ${p.authors}\nAbstract: ${p.abstract || 'N/A'}`,
      )
      .join('\n\n');

    const systemPrompt = `You are an expert academic writer specializing in literature reviews. Your task is to generate a comprehensive, well-structured literature review based on the provided papers.

Guidelines:
- Organize the review thematically, not just paper-by-paper
- Identify key trends, gaps, and future directions
- ${STYLE_INSTRUCTIONS[style]}
- ${LANGUAGE_INSTRUCTIONS[language]}
- Include proper in-text citations
- At the end, provide a properly formatted reference list
- Use clear section headings (## for main sections, ### for subsections)
- Be analytical and critical, not just descriptive${styleProfile ? `

STYLE PROFILE — You MUST match this writing style:
${styleProfile}` : ''}`;

    const userPrompt = `Topic: ${topic}

Based on the following ${paperList?.length || 0} papers, generate a comprehensive literature review:

${paperListText || '(No specific papers provided — generate a review based on the topic)'}

Please generate a well-structured literature review covering:
1. Introduction and background
2. Key themes and findings from the literature
3. Methodological approaches
4. Current trends and developments
5. Research gaps and future directions
6. Conclusion
7. References`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          for await (const token of streamLLM(llm, messages)) {
            send({ type: 'token', content: token });
          }

          // Extract citations from the generated text
          const citations = (paperList || []).map((p) => ({
            title: p.title,
            authors: p.authors,
            year: p.year,
          }));

          send({ type: 'done', citations });
        } catch (err) {
          send({
            type: 'error',
            message: err instanceof Error ? err.message : 'Unknown error occurred',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
