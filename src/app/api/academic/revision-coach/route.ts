import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface RevisionCoachBody {
  reviews: Array<{ reviewer: string; content: string }>;
  userReply?: string;
  round?: number;
  llm: LLMConfig;
}

const COACH_SYSTEM_PROMPT = `You are a Socratic revision coach helping an academic researcher respond to peer review feedback. Your role is to:

1. Read the reviewer comments carefully
2. For each major point, ask the researcher a Socratic question that guides them to think critically about how to address it
3. Be encouraging but intellectually rigorous
4. After the researcher responds, provide constructive follow-up
5. After 4-8 rounds of dialogue, synthesize the discussion into actionable revision steps

RULES:
- Ask ONE question at a time, focused on the most important reviewer concern
- Use the Socratic method: don't give answers directly, guide the researcher to discover them
- Reference specific reviewer comments by number/name
- Be warm and supportive — revision is stressful
- After enough rounds, output a structured revision plan

When the coaching is complete, output a JSON block wrapped in \`\`\`json ... \`\`\`:
{
  "type": "revision_plan",
  "steps": [
    {
      "reviewer_point": "Which reviewer comment this addresses",
      "action": "What to change",
      "reasoning": "Why this change addresses the concern",
      "priority": "high|medium|low"
    }
  ],
  "summary": "Brief summary of the revision strategy"
}`;

export async function POST(req: NextRequest) {
  try {
    const body: RevisionCoachBody = await req.json();
    const { reviews, userReply, round = 1, llm } = body;

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reviews are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build conversation
    const messages: Message[] = [
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here are the peer review comments I received:\n\n${reviews.map((r, i) => `--- ${r.reviewer} ---\n${r.content}`).join('\n\n')}\n\nPlease help me think through how to address these concerns. We are on round ${round} of our discussion.`,
      },
    ];

    // Add conversation history if user replied
    if (userReply && round > 1) {
      messages.push({ role: 'assistant', content: 'Based on the review comments, let me ask you about the most critical concern first...' });
      messages.push({ role: 'user', content: userReply });
      messages.push({
        role: 'user',
        content: `We are now on round ${round}. ${round >= 8 ? 'This is our final round — please synthesize everything into a revision plan.' : 'Please continue with the next question or provide feedback on my answer.'}`,
      });
    }

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

          // Try to extract revision plan JSON if present
          const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            try {
              const plan = JSON.parse(jsonMatch[1]);
              send({ type: 'revision_plan', data: plan });
            } catch {
              // Not valid JSON, that's fine
            }
          }

          send({ type: 'round', data: { round } });
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
