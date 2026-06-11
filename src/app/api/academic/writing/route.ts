import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

type Section = 'introduction' | 'methodology' | 'results' | 'discussion' | 'conclusion' | 'full';
type Style = 'apa' | 'ieee' | 'gb';

interface WritingBody {
  projectId: string;
  section?: Section;
  outline?: string;
  context?: string;
  topic?: string;
  style?: Style;
  language?: 'zh' | 'en';
  papers?: Array<{ title: string; authors: string; year: number; abstract?: string }>;
  llm: LLMConfig;
}

const STYLE_INSTRUCTIONS: Record<Style, string> = {
  apa: 'Use APA citation style (Author, Year). Format references in APA 7th edition.',
  ieee: 'Use IEEE citation style [1], [2], etc. Format references in IEEE numbered style.',
  gb: 'Use GB/T 7714 citation style (Author Year). Format references following Chinese national standard GB/T 7714-2015.',
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: '请用中文学术语言撰写。保持学术严谨性，使用规范的中文学术表达。',
  en: 'Write in English. Maintain academic rigor and use formal academic language.',
};

const SECTION_PROMPTS: Record<Section, string> = {
  introduction:
    'Write the Introduction section. Include: background and motivation, problem statement, research objectives, contributions, and paper organization overview.',
  methodology:
    'Write the Methodology section. Include: research design, data collection, methods/techniques used, experimental setup, and any tools or frameworks.',
  results:
    'Write the Results section. Present findings objectively with references to tables/figures. Include statistical results where applicable.',
  discussion:
    'Write the Discussion section. Interpret results, compare with existing work, discuss implications, acknowledge limitations, and suggest future directions.',
  conclusion:
    'Write the Conclusion section. Summarize key findings, highlight contributions, and suggest future research directions.',
  full:
    'Write a complete academic paper with all sections: Introduction, Related Work, Methodology, Results, Discussion, and Conclusion.',
};

function buildOutlinePrompt(topic: string, context: string, papers: string): string {
  return `You are an expert academic researcher. Based on the following research topic and literature review, generate a detailed paper outline.

Research Topic: ${topic}

Literature Review Summary:
${context || '(No review content provided)'}

Available Papers:
${papers || '(No papers listed)'}

Generate a structured outline with:
1. Introduction (background, problem statement, objectives, contributions)
2. Related Work (key themes from literature)
3. Methodology (proposed approach)
4. Expected Results / Experimental Design
5. Discussion (anticipated findings, implications)
6. Conclusion
7. References

Use markdown formatting with ## for main sections and ### for subsections. Include brief descriptions of what each subsection should cover.`;
}

export async function POST(req: NextRequest) {
  try {
    const body: WritingBody = await req.json();
    const {
      section = 'full',
      outline,
      context,
      topic,
      style = 'apa',
      language = 'zh',
      papers,
      llm,
    } = body;

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration (provider + apiKey) is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const paperListText = (papers || [])
      .map(
        (p, i) =>
          `[${i + 1}] ${p.title} (${p.year})\nAuthors: ${p.authors}${p.abstract ? `\nAbstract: ${p.abstract}` : ''}`,
      )
      .join('\n\n');

    // Determine if this is an outline generation or section writing request
    const isOutlineRequest = !outline && section === 'full';

    let systemPrompt: string;
    let userPrompt: string;

    if (isOutlineRequest) {
      systemPrompt = `You are an expert academic researcher and paper outline generator. Generate detailed, well-structured paper outlines.

Guidelines:
- ${STYLE_INSTRUCTIONS[style]}
- ${LANGUAGE_INSTRUCTIONS[language]}
- Use clear hierarchical structure
- Include brief descriptions for each section
- Be specific about what content each subsection should cover`;

      userPrompt = buildOutlinePrompt(topic || 'Research Topic', context || '', paperListText);
    } else {
      systemPrompt = `You are an expert academic paper writer. Write high-quality academic content based on the provided outline and context.

Guidelines:
- ${STYLE_INSTRUCTIONS[style]}
- ${LANGUAGE_INSTRUCTIONS[language]}
- Maintain academic rigor and formal tone
- Use proper citations from the provided papers
- Include in-text citations where appropriate
- Use clear section headings
- Be analytical and thorough`;

      userPrompt = `Research Topic: ${topic || 'Research'}

${outline ? `Paper Outline:\n${outline}\n\n` : ''}${context ? `Context (Literature Review):\n${context}\n\n` : ''}${paperListText ? `Available Papers for Citation:\n${paperListText}\n\n` : ''}Task: ${SECTION_PROMPTS[section]}

Write the ${section === 'full' ? 'complete paper' : section + ' section'} now.`;
    }

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
          let fullContent = '';
          for await (const token of streamLLM(llm, messages)) {
            fullContent += token;
            send({ type: 'token', content: token });
          }

          send({
            type: 'done',
            section,
            contentLength: fullContent.length,
          });
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
