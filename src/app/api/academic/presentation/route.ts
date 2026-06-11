import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface PresentationBody {
  content: string;
  presentationType: string; // outline, defense, speech
  language?: 'en' | 'zh';
  duration?: number; // minutes
  llm: LLMConfig;
}

const PRESENTATION_PROMPTS: Record<string, string> = {
  outline: `You are an expert academic presentation designer. Convert the following paper into a structured PPT outline.

Rules:
1. Create a clear slide-by-slide outline (15-25 slides for a typical paper)
2. Each slide should have: title, key points (3-5 bullet points), speaker notes
3. Suggest visual elements (charts, diagrams, images) where appropriate
4. Follow the standard academic presentation structure:
   - Title slide
   - Research background & motivation (2-3 slides)
   - Research questions / objectives
   - Literature review highlights (2-3 slides)
   - Methodology (2-3 slides)
   - Key results (3-5 slides)
   - Discussion & implications (2-3 slides)
   - Limitations & future work
   - Conclusion
   - References
   - Thank you / Q&A

Output format for each slide:
---
**Slide N: [Title]**
- Key point 1
- Key point 2
- Key point 3

📊 Visual: [suggested chart/diagram type]

📝 Speaker Notes: [what to say for this slide]
---`,

  defense: `You are an academic thesis defense coach. Generate comprehensive defense preparation materials based on the following paper.

Include:
1. **Opening Statement** (2 minutes) — How to introduce the research compellingly
2. **Key Messages** — The 3 most important takeaways the audience should remember
3. **Anticipated Questions & Answers** — Prepare for 10-15 likely questions from:
   - Committee members (methodology, rigor, novelty)
   - Domain experts (theoretical contribution)
   - General audience (significance, applications)
4. **Difficult Questions** — The hardest questions to expect and how to handle them
5. **Closing Statement** (1 minute) — How to end memorably
6. **Tips** — Presentation delivery advice specific to this content

Format each Q&A as:
**Q: [Question]**
A: [Suggested answer — be specific and reference the paper's content]`,

  speech: `You are a professional speech writer for academic conferences. Generate a presentation speech/script based on the following paper.

Rules:
1. Write a natural, conversational speech (not reading from paper)
2. Include timing markers [0:00], [0:30], etc.
3. Use storytelling techniques to engage the audience
4. Include transition phrases between sections
5. Add emphasis markers for key points: ⭐ KEY POINT
6. Include pauses: [pause]
7. Suggest audience interaction moments

Duration target: ${'{duration}'} minutes

Structure:
- Hook (30 seconds) — Start with a compelling question or story
- Context (1-2 min) — Why this research matters
- Problem (1-2 min) — What gap this fills
- Approach (2-3 min) — How you solved it
- Results (2-3 min) — What you found (⭐ key section)
- Impact (1-2 min) — Why it matters
- Close (30 seconds) — Memorable ending`,
};

export async function POST(req: NextRequest) {
  try {
    const body: PresentationBody = await req.json();
    const { content, presentationType, language = 'en', duration = 15, llm } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const systemPrompt = (PRESENTATION_PROMPTS[presentationType] || PRESENTATION_PROMPTS.outline)
      .replace('{duration}', String(duration));
    const langNote = language === 'zh'
      ? '\nGenerate the output in Chinese (中文). Keep technical terms in English where standard.'
      : '\nGenerate the output in English.';

    const llmMessages: Message[] = [
      { role: 'system', content: systemPrompt + langNote },
      { role: 'user', content: `Please generate presentation materials for the following paper:\n\n${content.substring(0, 20000)}` },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let fullResponse = '';
          for await (const token of streamLLM(llm, llmMessages)) {
            fullResponse += token;
            send({ type: 'token', content: token });
          }

          send({ type: 'done', content: fullResponse });
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
