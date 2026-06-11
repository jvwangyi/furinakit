import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';
import { getAltKeys, streamLLMWithKeyRotation } from '@/lib/academic/llm-helpers';
import { getSessionUser } from '@/lib/auth-helpers';

interface BrainstormBody {
  topic: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  llm: LLMConfig;
  mode?: 'brainstorm' | 'analyze';
}

const BRAINSTORM_SYSTEM_PROMPT = `You are an experienced academic research mentor using the Socratic method to help a student refine their research topic into a well-defined research question.

Your goal is to guide the student through a structured exploration:
1. **Research Background** — Understand the broad area and context
2. **Research Problem** — Narrow down to a specific, researchable problem
3. **Methodology** — Explore what methods might be appropriate
4. **Keywords** — Identify optimal search terms

RULES:
- Ask ONE focused question at a time
- Be warm but intellectually rigorous
- If the student's answer is vague, probe deeper with follow-up questions
- After 4-6 rounds of questions, synthesize everything into an RQ Brief

When you have enough information, output a JSON block wrapped in \`\`\`json ... \`\`\` with this format:
{
  "type": "rq_brief",
  "research_background": "What the student is studying and why",
  "research_question": "The refined, specific research question",
  "methodology_hint": "Suggested methodological approach",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "optimized_query": "The best search query for academic databases"
}

Until then, just ask your next question naturally.`;

const ANALYZE_SYSTEM_PROMPT = `You are an academic search query optimizer. Given a natural language description of what someone wants to research, extract optimal search keywords for academic databases (Semantic Scholar, arXiv, Google Scholar).

Rules:
1. Output ONLY a JSON array of keyword strings, nothing else
2. Include 3-6 English keywords/phrases suitable for academic search
3. Include both specific terms and broader synonyms
4. If input is in Chinese, translate to English academic terms
5. Use standard academic terminology

Example input: "I want to find automated methods for tree skeleton extraction"
Example output: ["tree skeleton extraction", "automated tree reconstruction", "plant architecture", "branch detection"]

Example input: "deep learning for medical image segmentation"
Example output: ["deep learning", "medical image segmentation", "convolutional neural network", "U-Net", "biomedical imaging"]

Output ONLY the JSON array, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const body: BrainstormBody = await req.json();
    const { topic, messages = [], llm, mode = 'brainstorm' } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Topic is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get user for key rotation (optional - works without auth too)
    const sessionUser = await getSessionUser(req).catch(() => null);
    const userId = sessionUser?.id || '';

    // ─── Analyze mode: single-round keyword extraction ──────────────
    if (mode === 'analyze') {
      const userText = messages.length > 0 ? messages[messages.length - 1].content : topic;
      const llmMessages: Message[] = [
        { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
        { role: 'user', content: userText },
      ];

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (data: Record<string, unknown>) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            let fullResponse = '';
    const altKeys = await getAltKeys(userId, llm.provider, llm.apiKey).catch(() => []);
            for await (const token of streamLLMWithKeyRotation(llm, llmMessages, altKeys)) {
              fullResponse += token;
              send({ type: 'token', content: token });
            }

            const keywords = parseKeywordArray(fullResponse);
            if (keywords.length > 0) {
              send({ type: 'keywords', data: keywords });
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
    }

    // ─── Brainstorm mode: Socratic dialogue ────────────────────────
    const llmMessages: Message[] = [
      { role: 'system', content: BRAINSTORM_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `I want to research: ${topic}`,
      },
    ];

    for (const msg of messages) {
      llmMessages.push({ role: msg.role, content: msg.content });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
        const altKeys = await getAltKeys(userId, llm.provider, llm.apiKey).catch(() => []);
          let fullResponse = '';
          for await (const token of streamLLMWithKeyRotation(llm, llmMessages, altKeys)) {
            fullResponse += token;
            send({ type: 'token', content: token });
          }

          // Try to extract RQ Brief JSON if present
          const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              const rqBrief = JSON.parse(jsonMatch[1]);
              send({ type: 'rq_brief', data: rqBrief });
            } catch {
              // Not valid JSON, that's fine — it's still a question
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

function parseKeywordArray(content: string): string[] {
  try {
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter((k): k is string => typeof k === 'string' && k.trim().length > 0);
      }
    }
  } catch { /* ignore parse errors */ }
  return [];
}
