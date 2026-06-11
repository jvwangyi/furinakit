import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface SummaryBody {
  projectId?: string;
  projectName?: string;
  topic?: string;
  papers?: Array<{ title: string; authors: string | null; year: number | null }>;
  reviews?: Array<{ stage: string; type: string; content: string; score: number | null }>;
  llm: LLMConfig;
}

const SUMMARY_PROMPT = `You are a research quality assessor. Based on the project data provided, generate a comprehensive Process Summary with a 6-dimension collaboration quality assessment.

Dimensions (each scored 1-100):
1. **Research Depth** — Breadth and depth of literature coverage, diversity of sources
2. **Writing Quality** — Academic register, coherence, structure of the generated review
3. **Review Rigor** — Thoroughness of peer review, quality of feedback from reviewers
4. **Revision Responsiveness** — How well revision addressed reviewer concerns
5. **Integrity** — Results of integrity checks, material passport completeness
6. **Reproducibility** — Whether the research process is documented and reproducible

Output ONLY valid JSON:
{
  "type": "process_summary",
  "project_name": "project name",
  "dimensions": [
    {"name": "Research Depth", "name_zh": "研究深度", "score": <1-100>, "comment": "brief justification"},
    {"name": "Writing Quality", "name_zh": "写作质量", "score": <1-100>, "comment": "brief justification"},
    {"name": "Review Rigor", "name_zh": "审稿严格度", "score": <1-100>, "comment": "brief justification"},
    {"name": "Revision Responsiveness", "name_zh": "修改响应度", "score": <1-100>, "comment": "brief justification"},
    {"name": "Integrity", "name_zh": "完整性", "score": <1-100>, "comment": "brief justification"},
    {"name": "Reproducibility", "name_zh": "可复现性", "score": <1-100>, "comment": "brief justification"}
  ],
  "overall_score": <1-100>,
  "overall_level": "excellent|good|acceptable|needs_work",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "completion_report": "A detailed narrative summary of the entire research process and its quality"
}`;

export async function POST(req: NextRequest) {
  try {
    const body: SummaryBody = await req.json();
    const { projectName, topic, papers, reviews, llm } = body;

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build context from project data
    const context = `Project: ${projectName || 'Unknown'}
Topic: ${topic || 'Not specified'}

Papers (${papers?.length || 0}):
${(papers || []).map((p, i) => `${i + 1}. ${p.title} (${p.authors || 'Unknown'}, ${p.year || 'N/A'})`).join('\n')}

Review History:
${(reviews || []).map(r => `[${r.stage}/${r.type}] Score: ${r.score ?? 'N/A'}\n${r.content.substring(0, 500)}`).join('\n\n---\n\n')}`;

    const messages: Message[] = [
      { role: 'system', content: SUMMARY_PROMPT },
      { role: 'user', content: `Please generate a process summary for this research project:\n\n${context}` },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let fullResponse = '';
          for await (const token of streamLLM(llm, messages)) {
            fullResponse += token;
            send({ type: 'token', content: token });
          }

          // Try to extract structured summary
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const summary = JSON.parse(jsonMatch[0]);
              send({ type: 'summary_data', data: summary });
            } catch {
              // Not valid JSON
            }
          }

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
