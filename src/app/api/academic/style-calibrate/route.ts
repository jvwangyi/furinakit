import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface StyleCalibrateBody {
  content: string;
  llm: LLMConfig;
}

const STYLE_ANALYSIS_PROMPT = `You are an expert in academic writing style analysis. Analyze the following text and produce a detailed "Style Profile" that captures the author's unique writing voice.

Analyze these dimensions:
1. **Vocabulary Level** — Formal/informal, technical density, preferred terminology
2. **Sentence Structure** — Average sentence length, use of complex/compound sentences, clause patterns
3. **Tone** — Authoritative, conversational, cautious, assertive, etc.
4. **Transition Patterns** — How paragraphs and ideas connect (however, moreover, furthermore, etc.)
5. **Citation Integration** — How citations are woven into text (parenthetical vs. narrative)
6. **Hedging Language** — Frequency of qualifiers (may, might, possibly, suggests)
7. **Rhetorical Devices** — Use of analogies, metaphors, questions, lists
8. **Paragraph Structure** — Topic sentence patterns, paragraph length distribution

Output a structured Style Profile in Markdown format that can be used as a system prompt to make future writing match this style. Be specific with examples from the text.`;

export async function POST(req: NextRequest) {
  try {
    const body: StyleCalibrateBody = await req.json();
    const { content, llm } = body;

    if (!content || typeof content !== 'string' || content.trim().length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content must be at least 100 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const messages: Message[] = [
      { role: 'system', content: STYLE_ANALYSIS_PROMPT },
      { role: 'user', content: `Please analyze the writing style of the following text:\n\n${content.substring(0, 15000)}` },
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

          send({ type: 'style_profile', data: { profile: fullResponse } });
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
