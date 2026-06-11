import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface PolishingBody {
  content: string;
  polishType: string; // language, grammar, academic, style, format, all
  language?: 'en' | 'zh';
  formatStyle?: 'apa' | 'ieee' | 'gb' | 'mla' | 'chicago';
  llm: LLMConfig;
}

const POLISHING_PROMPTS: Record<string, string> = {
  language: `You are an expert academic language editor. Your task is to polish the language of the following academic text.

Focus on:
1. Improve word choice — use precise academic vocabulary
2. Enhance sentence flow and readability
3. Remove redundancy and wordiness
4. Ensure consistent tone (formal academic)
5. Fix awkward phrasing

Rules:
- Preserve the original meaning exactly
- Do NOT add new content or change the argument
- Show changes using markdown: ~~deleted text~~ → **added text**
- After the revised text, provide a brief summary of changes made`,

  grammar: `You are a meticulous grammar checker for academic writing. Your task is to identify and correct all grammar errors.

Focus on:
1. Subject-verb agreement
2. Tense consistency
3. Article usage (a/an/the)
4. Preposition accuracy
5. Pronoun reference clarity
6. Sentence fragments and run-ons
7. Comma splices and punctuation

Rules:
- Show each correction with: ❌ original → ✅ corrected
- Categorize errors by type
- Provide the fully corrected text at the end
- Note patterns of recurring errors`,

  academic: `You are an academic writing specialist. Your task is to elevate the text to publication-quality academic language.

Focus on:
1. Replace informal/colloquial expressions with academic equivalents
2. Ensure hedging language is appropriate (avoid overclaiming)
3. Use discipline-appropriate terminology
4. Improve logical connectors between sentences/paragraphs
5. Ensure proper use of passive vs active voice
6. Check citation integration (if present)

Rules:
- Preserve the original meaning
- Show changes clearly
- Provide a list of informal → academic replacements made
- Rate the academic tone before and after (1-10)`,

  style: `You are a style editor for academic papers. Your task is to improve the writing style while maintaining academic rigor.

Focus on:
1. Sentence variety (length, structure)
2. Paragraph coherence and topic sentences
3. Transition effectiveness
4. Conciseness without losing meaning
5. Parallel structure
6. Active vs passive voice balance

Rules:
- Show before/after for significant changes
- Explain the rationale for major style changes
- Ensure the text reads smoothly as a cohesive piece`,

  format: `You are an academic formatting expert. Your task is to check and correct the formatting of the following text.

Focus on:
1. Heading hierarchy (proper levels)
2. Citation format consistency
3. Number/date formatting conventions
4. Abbreviation definitions (first use)
5. Table/figure reference format
6. Quotation mark style consistency
7. List formatting (parallel structure)

Rules:
- Flag formatting inconsistencies
- Suggest corrections with reference to standard guidelines
- Note any missing elements (e.g., undefined abbreviations)`,

  all: `You are a comprehensive academic editor. Perform a thorough review of the following text covering:
1. Language quality and word choice
2. Grammar and punctuation
3. Academic tone and terminology
4. Writing style and flow
5. Formatting consistency

Provide:
1. A fully polished version of the text
2. A summary of changes by category
3. Overall quality score (before/after, 1-10)
4. Top 3 areas that still need human attention`,
};

export async function POST(req: NextRequest) {
  try {
    const body: PolishingBody = await req.json();
    const { content, polishType, language = 'en', formatStyle, llm } = body;

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

    const systemPrompt = POLISHING_PROMPTS[polishType] || POLISHING_PROMPTS.all;
    const langNote = language === 'zh'
      ? '\nThe text is in Chinese. Apply Chinese academic writing conventions. Output in Chinese.'
      : '\nThe text is in English. Apply English academic writing conventions. Output in English.';
    const formatNote = formatStyle
      ? `\nApply ${formatStyle.toUpperCase()} formatting guidelines where applicable.`
      : '';

    const llmMessages: Message[] = [
      { role: 'system', content: systemPrompt + langNote + formatNote },
      { role: 'user', content: `Please polish the following text:\n\n${content.substring(0, 20000)}` },
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
