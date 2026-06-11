import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface StatisticsBody {
  data: string; // CSV or JSON string
  analysisType: string; // descriptive, ttest, anova, regression, correlation, auto
  llm: LLMConfig;
  additionalContext?: string;
}

const STATISTICS_SYSTEM_PROMPT = `You are an expert biostatistician and data analyst. Your task is to perform statistical analysis on the provided data and generate a comprehensive report.

Rules:
1. First, identify the data structure (variables, types, sample size)
2. Perform the requested analysis (or suggest appropriate analyses if "auto")
3. Report results in APA format
4. Include interpretation and practical significance
5. Flag any assumptions violations or concerns
6. Suggest follow-up analyses if appropriate

Output your analysis as a structured report with these sections:
- Data Overview (sample size, variables, missing data)
- Descriptive Statistics (means, SDs, frequencies as appropriate)
- Main Analysis (test statistic, df, p-value, effect size)
- Interpretation (what the results mean in context)
- Assumptions & Limitations
- Recommendations

Be precise with numbers. Use standard statistical notation.`;

export async function POST(req: NextRequest) {
  try {
    const body: StatisticsBody = await req.json();
    const { data, analysisType, llm, additionalContext } = body;

    if (!data || typeof data !== 'string' || data.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const analysisTypeMap: Record<string, string> = {
      descriptive: 'Perform descriptive statistics (mean, median, SD, range, frequencies)',
      ttest: 'Perform independent samples t-test (or paired if data structure suggests it)',
      anova: 'Perform one-way ANOVA with post-hoc comparisons',
      regression: 'Perform linear regression analysis',
      correlation: 'Perform correlation analysis (Pearson or Spearman as appropriate)',
      auto: 'Analyze the data and perform the most appropriate statistical tests',
    };

    const analysisInstruction = analysisTypeMap[analysisType] || analysisTypeMap.auto;

    const userPrompt = `Please analyze the following data:

\`\`\`
${data.substring(0, 15000)}
\`\`\`

Analysis requested: ${analysisInstruction}
${additionalContext ? `\nAdditional context: ${additionalContext}` : ''}

Provide a comprehensive statistical analysis report.`;

    const llmMessages: Message[] = [
      { role: 'system', content: STATISTICS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
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
