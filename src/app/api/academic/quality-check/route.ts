import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface QualityCheckBody {
  content: string;
  llm: LLMConfig;
}

const QUALITY_DIMENSIONS = [
  {
    id: 'logic_coherence',
    name: 'Logic Coherence',
    nameZh: '逻辑连贯性',
    prompt: 'Evaluate the logical flow and coherence of the text. Check for logical gaps, non-sequiturs, and whether arguments build upon each other naturally.',
  },
  {
    id: 'paragraph_transition',
    name: 'Paragraph Transitions',
    nameZh: '段落过渡',
    prompt: 'Evaluate how well paragraphs transition into each other. Check for smooth topic shifts, use of transition phrases, and thematic continuity.',
  },
  {
    id: 'citation_density',
    name: 'Citation Density',
    nameZh: '引用密度',
    prompt: 'Evaluate whether the citation density is appropriate — not too sparse (unsupported claims) nor too dense (over-cited). Check that key claims are backed by citations.',
  },
  {
    id: 'sentence_variety',
    name: 'Sentence Variety',
    nameZh: '句式多样性',
    prompt: 'Evaluate the variety of sentence structures. Check for monotony, repetitive patterns, and whether the text uses a mix of simple, compound, and complex sentences.',
  },
  {
    id: 'academic_register',
    name: 'Academic Register',
    nameZh: '学术用语规范',
    prompt: 'Evaluate whether the text maintains appropriate academic register. Check for colloquialisms, contractions, informal language, and whether technical terms are used correctly.',
  },
];

function buildQualityPrompt(dim: (typeof QUALITY_DIMENSIONS)[number], content: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are an expert academic writing quality assessor. ${dim.prompt}

Rate the text on a scale of 1-10 for this dimension and provide specific, actionable improvement suggestions.

Output ONLY valid JSON:
{
  "dimension": "${dim.id}",
  "dimension_name": "${dim.name}",
  "score": <1-10>,
  "summary": "Brief assessment in 1-2 sentences",
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`,
    },
    {
      role: 'user',
      content: `Evaluate the following academic text:\n\n${content.substring(0, 12000)}`,
    },
  ];
}

interface DimensionResult {
  dimension: string;
  dimension_name: string;
  score: number;
  summary: string;
  issues: string[];
  suggestions: string[];
}

function parseDimensionResult(text: string): DimensionResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as DimensionResult;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: QualityCheckBody = await req.json();
    const { content, llm } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content must be at least 50 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const results: DimensionResult[] = [];

          for (const dim of QUALITY_DIMENSIONS) {
            send({
              type: 'check_start',
              dimension: dim.id,
              dimension_name: dim.name,
              dimension_name_zh: dim.nameZh,
              message: `Checking ${dim.name}...`,
            });

            let llmResult = '';
            for await (const token of streamLLM(llm, buildQualityPrompt(dim, content))) {
              llmResult += token;
            }

            const parsed = parseDimensionResult(llmResult);
            if (parsed) {
              results.push(parsed);
              send({ type: 'check_result', data: parsed });
            } else {
              const fallback: DimensionResult = {
                dimension: dim.id,
                dimension_name: dim.name,
                score: 5,
                summary: 'Could not parse assessment. Manual review recommended.',
                issues: [],
                suggestions: [],
              };
              results.push(fallback);
              send({ type: 'check_result', data: fallback });
            }
          }

          // Compute overall quality score
          const avgScore = Math.round(
            (results.reduce((sum, r) => sum + r.score, 0) / results.length) * 10,
          );

          const summary = {
            dimensions: results,
            overall_score: avgScore,
            overall_level:
              avgScore >= 80 ? 'excellent' :
              avgScore >= 60 ? 'good' :
              avgScore >= 40 ? 'needs_improvement' : 'poor',
          };

          send({ type: 'summary', data: summary });
          send({ type: 'done' });
        } catch (err) {
          send({
            type: 'error',
            message: err instanceof Error ? err.message : 'Unknown error',
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
