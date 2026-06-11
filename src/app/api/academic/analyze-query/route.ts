import { NextRequest, NextResponse } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface AnalyzeQueryBody {
  query: string;
  llm: LLMConfig;
}

const ANALYZE_SYSTEM_PROMPT = `You are an academic search query optimizer. Given a natural language description of what someone wants to research, extract optimal search keywords for academic databases (Semantic Scholar, arXiv, Google Scholar).

Rules:
1. Output ONLY a JSON array of keyword strings, nothing else
2. Include 3-6 English keywords/phrases suitable for academic search
3. Include both specific terms and broader synonyms
4. If input is in Chinese, translate to English academic terms
5. Use standard academic terminology

Example input: "我想找关于梨树骨架提取的自动化方法"
Example output: ["tree skeleton extraction", "automated tree reconstruction", "plant architecture", "branch detection", "pear tree"]

Example input: "deep learning for medical image segmentation"
Example output: ["deep learning", "medical image segmentation", "convolutional neural network", "U-Net", "biomedical imaging"]

Output ONLY the JSON array, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeQueryBody = await req.json();
    const { query, llm } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return NextResponse.json(
        { success: false, error: 'LLM configuration is required' },
        { status: 400 },
      );
    }

    const llmMessages: Message[] = [
      { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
      { role: 'user', content: query.trim() },
    ];

    // Use non-streaming call for quick response
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      // Build request config inline (same pattern as socratic but non-streaming)
      const config = { ...llm, maxTokens: 512 };

      // Use a simplified non-streaming approach
      const response = await fetch(getEndpoint(config.provider), {
        method: 'POST',
        headers: getHeaders(config),
        body: JSON.stringify(getBody(config, llmMessages)),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        return NextResponse.json(
          { success: false, error: `LLM error: ${response.status}` },
          { status: 502 },
        );
      }

      const data = await response.json();
      const content = extractContent(data, config.provider);

      // Parse JSON array from response
      const keywords = parseKeywords(content);

      if (keywords.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Could not extract keywords' },
          { status: 422 },
        );
      }

      return NextResponse.json({ success: true, keywords });
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'LLM request timed out' },
          { status: 504 },
        );
      }
      throw e;
    }
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}

function getEndpoint(provider: string): string {
  switch (provider) {
    case 'claude': return 'https://api.anthropic.com/v1/messages';
    case 'openai': return 'https://api.openai.com/v1/chat/completions';
    case 'deepseek': return 'https://api.deepseek.com/v1/chat/completions';
    default: return 'https://api.openai.com/v1/chat/completions';
  }
}

function getHeaders(config: LLMConfig): Record<string, string> {
  switch (config.provider) {
    case 'claude':
      return {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      };
    case 'openai':
    case 'deepseek':
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      };
    default:
      return { 'Content-Type': 'application/json' };
  }
}

function getBody(config: LLMConfig, messages: Message[]): Record<string, unknown> {
  const model = config.model || (config.provider === 'claude' ? 'claude-sonnet-4-20250514' : 'gpt-4o');

  if (config.provider === 'claude') {
    const systemMsgs = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');
    return {
      model,
      max_tokens: config.maxTokens || 512,
      system: systemMsgs.map(m => m.content).join('\n'),
      messages: nonSystem,
    };
  }

  return {
    model,
    max_tokens: config.maxTokens || 512,
    messages,
  };
}

function extractContent(data: Record<string, unknown>, provider: string): string {
  if (provider === 'claude') {
    const content = data.content as Array<{ type: string; text: string }> | undefined;
    return content?.map(c => c.text).join('') || '';
  }
  // OpenAI / DeepSeek
  const choices = data.choices as Array<{ message: { content: string } }> | undefined;
  return choices?.[0]?.message?.content || '';
}

function parseKeywords(content: string): string[] {
  try {
    // Try to find JSON array in the response
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
