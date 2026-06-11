import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface SocraticBody {
  topic: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  llm: LLMConfig;
  /** Single-round analysis mode: just extract keywords, no Socratic dialogue */
  mode?: 'socratic' | 'analyze';
}

const SOCRATIC_SYSTEM_PROMPT = `You are an experienced academic research mentor using the Socratic method to help a student refine their research topic into a well-defined research question.

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
1. Output a JSON object with two fields: "keywords" (array of strings) and "reasoning" (string)
2. Include 3-6 English keywords/phrases suitable for academic search in the keywords array
3. Include both specific terms and broader synonyms
4. If input is in Chinese, translate to English academic terms
5. Use standard academic terminology
6. In the reasoning field, briefly explain WHY you chose these keywords (in the same language as the input)

Example input: "I want to find automated methods for tree skeleton extraction"
Example output: {"keywords": ["tree skeleton extraction", "automated tree reconstruction", "plant architecture", "branch detection"], "reasoning": "I included the core term 'tree skeleton extraction' directly, along with 'automated tree reconstruction' as a close synonym. 'plant architecture' covers the broader field, and 'branch detection' targets the key sub-task."}

Example input: "深度学习在医学图像分割中的应用"
Example output: {"keywords": ["deep learning", "medical image segmentation", "convolutional neural network", "U-Net", "biomedical imaging"], "reasoning": "我从核心方法（深度学习）和应用领域（医学图像分割）两个维度出发，选择了涵盖基础架构（CNN）、经典模型（U-Net）和更广泛领域（生物医学成像）的关键词。"}

Output ONLY the JSON object, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const body: SocraticBody = await req.json();
    const { topic, messages = [], llm, mode = 'socratic' } = body;

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
            for await (const token of streamLLM(llm, llmMessages)) {
              fullResponse += token;
              send({ type: 'token', content: token });
            }

            // Parse JSON object or array from response
            const parsed = parseAnalyzeResponse(fullResponse);
            if (parsed.keywords.length > 0) {
              send({ type: 'keywords', data: parsed.keywords, reasoning: parsed.reasoning });
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

    // ─── Socratic mode: multi-round dialogue ────────────────────────
    const llmMessages: Message[] = [
      { role: 'system', content: SOCRATIC_SYSTEM_PROMPT },
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
          let fullResponse = '';
          for await (const token of streamLLM(llm, llmMessages)) {
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

/** Parse keywords and reasoning from LLM response text */
function parseAnalyzeResponse(content: string): { keywords: string[]; reasoning: string } {
  try {
    // Try JSON object first (new format)
    const objMatch = content.match(/\{[\s\S]*?\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      if (parsed && Array.isArray(parsed.keywords)) {
        const keywords = parsed.keywords.filter((k: unknown): k is string => typeof k === 'string' && k.trim().length > 0);
        const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';
        return { keywords, reasoning };
      }
    }
    // Fallback: try JSON array (backward compatibility)
    const arrMatch = content.match(/\[[\s\S]*?\]/);
    if (arrMatch) {
      const parsed = JSON.parse(arrMatch[0]);
      if (Array.isArray(parsed)) {
        const keywords = parsed.filter((k: unknown): k is string => typeof k === 'string' && k.trim().length > 0);
        return { keywords, reasoning: '' };
      }
    }
  } catch { /* ignore parse errors */ }
  return { keywords: [], reasoning: '' };
}
