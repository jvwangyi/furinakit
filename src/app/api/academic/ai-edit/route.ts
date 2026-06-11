import { NextRequest } from 'next/server';
import { streamLLMWithRetry, type LLMConfig, type Message } from '@/lib/academic/llm';

interface AIBody {
  content: string;
  instruction: string;
  context?: string;
  llm: LLMConfig;
  /** Alt keys for rotation on failure */
  altKeys?: string[];
}

const SYSTEM_PROMPT = `You are an expert academic writing assistant. The user will provide you with:
1. Current content (their text)
2. An editing instruction (what they want changed)
3. Optional context (e.g., topic, paper list, research area)

Your job is to apply the instruction to the content and return ONLY the modified content.

Rules:
- Return ONLY the modified content, no explanations, no markdown fences, no preamble
- Preserve the original structure and formatting unless the instruction asks to change it
- If the instruction is vague, make reasonable academic improvements
- Keep the same language as the original content
- Maintain academic tone and rigor`;

export async function POST(req: NextRequest) {
  try {
    const body: AIBody = await req.json();
    const { content, instruction, context, llm, altKeys = [] } = body;

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!instruction || typeof instruction !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Instruction is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userMessage = context
      ? `## Context\n${context}\n\n## Current Content\n${content}\n\n## Instruction\n${instruction}`
      : `## Current Content\n${content}\n\n## Instruction\n${instruction}`;

    const llmMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let fullResponse = '';
          for await (const token of streamLLMWithRetry(llm, llmMessages, altKeys)) {
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
