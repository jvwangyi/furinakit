import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';

interface IntegrityBody {
  projectId?: string;
  content: string;
  llm: LLMConfig;
  mode?: 'standard' | 'deep'; // deep = final integrity check
  papers?: Array<{ title: string; authors: string | null; year: number | null; url: string | null }>;
}

// ── The 7 AI failure mode checks ──────────────────────────────

const FAILURE_MODES = [
  {
    id: 'M1',
    name: 'Citation Hallucination',
    nameZh: '引用幻觉',
    description: 'References that do not exist — fabricated DOIs, invented paper titles, or phantom authors.',
    prompt: `Check whether any cited references in the text appear to be fabricated or hallucinated. Look for:
- Paper titles that seem plausible but may not exist
- DOIs that are malformed or suspicious
- Author names combined with years that don't match real publications
- Generic-sounding journal names
Report each suspicious citation with evidence.`,
  },
  {
    id: 'M2',
    name: 'Data Fabrication',
    nameZh: '数据捏造',
    description: 'Invented statistics, fake experimental results, or impossible precision.',
    prompt: `Check whether any statistical data, experimental results, or numerical claims appear fabricated. Look for:
- Suspiciously round or convenient numbers
- Statistics that are internally inconsistent
- P-values or confidence intervals that seem too perfect
- Sample sizes that don't match claimed methodology
- Impossible precision (e.g., claiming exact percentages from small samples)
Report each suspicious data point.`,
  },
  {
    id: 'M3',
    name: 'Methodology Fraud',
    nameZh: '方法论造假',
    description: 'Claims about methods that don\'t hold up — impossible protocols, contradictory steps.',
    prompt: `Check whether the described methodology is internally consistent and plausible. Look for:
- Contradictory methodological steps
- Protocols that are physically or logically impossible
- Missing critical methodological details that would be required for reproducibility
- Methods that don't match the claimed research questions
Report each methodological concern.`,
  },
  {
    id: 'M4',
    name: 'Shortcut Dependency',
    nameZh: '捷径依赖',
    description: 'Overly simplified analysis that skips necessary rigor.',
    prompt: `Check whether the analysis shows signs of shortcuts or oversimplification. Look for:
- Complex claims supported by trivially simple analyses
- Missing statistical tests that should have been performed
- Oversimplified models for complex phenomena
- Cherry-picked examples presented as general findings
- Lack of control groups or baselines where expected
Report each instance of insufficient analytical rigor.`,
  },
  {
    id: 'M5',
    name: 'Bug-as-Discovery',
    nameZh: '将 bug 包装为发现',
    description: 'Errors or artifacts in code/experiments presented as novel findings.',
    prompt: `Check whether what is presented as a "finding" might actually be an artifact, bug, or error. Look for:
- Results that could easily be explained by common implementation errors
- "Novel" patterns that match known data processing artifacts
- Findings that contradict well-established principles without adequate explanation
- Suspiciously clean results that suggest overfitting or data leakage
Report each potential artifact.`,
  },
  {
    id: 'M6',
    name: 'Framework Lock-in',
    nameZh: '框架锁定',
    description: 'Ignoring alternative explanations or frameworks that better fit the evidence.',
    prompt: `Check whether the text shows signs of framework lock-in — ignoring plausible alternative explanations. Look for:
- Claims of novelty when similar approaches exist
- Failure to consider simpler explanations for observed phenomena
- Ignoring well-known confounding factors
- Presenting one interpretation as the only possibility
- Missing discussion of limitations and alternative hypotheses
Report each instance of narrow framing.`,
  },
  {
    id: 'M7',
    name: 'Assertion-Citation Mismatch',
    nameZh: '断言-引用不匹配',
    description: 'Claims that are not actually supported by the cited sources.',
    prompt: `Check whether the assertions in the text are actually supported by the cited references. Look for:
- Claims that overstate what the referenced paper actually showed
- Citations used as general authority rather than specific evidence
- "X showed Y" when X actually showed Z
- Citations that support the opposite of what's claimed
- Aggregate claims attributed to a single source
Report each mismatch between assertion and citation.`,
  },
];

// ── Material Passport prompt ──────────────────────────────────

const MATERIAL_PASSPORT_PROMPT = `You are an academic source credibility assessor. For each referenced paper/source in the text, generate a "Material Passport" that evaluates its credibility.

For each source found in the text, output a JSON object with:
{
  "source_type": "peer-reviewed|preprint|conference|website|book|unknown",
  "credibility_rating": "high|medium|low|unverifiable",
  "recency": "recent_5y|5_to_10y|over_10y",
  "citation_support": "supports|contradicts|partially_supports|unrelated",
  "confidence": <0.0-1.0>,
  "notes": "Brief explanation of the assessment"
}

Output ONLY a JSON array of passport objects, one per source found.`;

function buildCheckPrompt(mode: (typeof FAILURE_MODES)[number], content: string, isDeep: boolean): Message[] {
  const deepNote = isDeep
    ? '\n\nIMPORTANT: This is a DEEP/FINAL integrity check. Apply ZERO TOLERANCE — any issue, no matter how minor, should be flagged. Be maximally strict.'
    : '';

  return [
    {
      role: 'system',
      content: `You are a meticulous academic integrity auditor. Your task is to check a piece of academic writing for a specific failure mode.

FAILURE MODE: ${mode.id} — ${mode.name} (${mode.nameZh})
Description: ${mode.description}

${mode.prompt}
${deepNote}

IMPORTANT RULES:
- Be thorough but fair. Not every potential issue is a real issue.
- Rate your finding as: PASS (no issue found), SUSPECTED (possible issue, needs investigation), or FAIL (clear issue found).
- Provide specific evidence from the text for any FAIL or SUSPECTED findings.
- Output ONLY valid JSON in this exact format:
{
  "mode_id": "${mode.id}",
  "mode_name": "${mode.name}",
  "status": "PASS" | "SUSPECTED" | "FAIL",
  "confidence": <0.0-1.0>,
  "findings": [
    {
      "severity": "critical" | "major" | "minor",
      "location": "quote or description of where in the text",
      "description": "what the issue is",
      "evidence": "specific text or data that supports the finding"
    }
  ],
  "summary": "Brief summary of the check result"
}`,
    },
    {
      role: 'user',
      content: `Please check the following academic text for ${mode.id} (${mode.name}):\n\n${content.substring(0, 12000)}`,
    },
  ];
}

interface CheckResult {
  mode_id: string;
  mode_name: string;
  status: 'PASS' | 'SUSPECTED' | 'FAIL';
  confidence: number;
  findings: Array<{
    severity: string;
    location: string;
    description: string;
    evidence: string;
  }>;
  summary: string;
}

interface MaterialPassport {
  title: string;
  source_type: string;
  credibility_rating: string;
  recency: string;
  citation_support: string;
  confidence: number;
  notes: string;
}

function parseCheckResult(text: string): CheckResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as CheckResult;
  } catch {
    return null;
  }
}

function parsePassports(text: string): MaterialPassport[] | null {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as MaterialPassport[];
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body: IntegrityBody = await req.json();
    const { projectId, content, llm, mode = 'standard', papers } = body;

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

    // Verify project ownership if projectId provided
    if (projectId) {
      const project = await prisma.academicProject.findFirst({
        where: { id: projectId, userId: user.id },
      });
      if (!project) {
        return new Response(
          JSON.stringify({ success: false, error: 'Project not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    const isDeep = mode === 'deep';
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const results: CheckResult[] = [];

          // ── Run 7 failure mode checks ──
          for (const failureMode of FAILURE_MODES) {
            send({
              type: 'check_start',
              mode_id: failureMode.id,
              mode_name: failureMode.name,
              mode_name_zh: failureMode.nameZh,
              message: `Checking ${failureMode.id}: ${failureMode.name}${isDeep ? ' (DEEP MODE)' : ''}...`,
            });

            let llmResult = '';
            for await (const token of streamLLM(llm, buildCheckPrompt(failureMode, content, isDeep))) {
              llmResult += token;
            }

            const parsed = parseCheckResult(llmResult);
            if (parsed) {
              results.push(parsed);
              send({ type: 'check_result', data: parsed });
            } else {
              const fallback: CheckResult = {
                mode_id: failureMode.id,
                mode_name: failureMode.name,
                status: 'SUSPECTED',
                confidence: 0.3,
                findings: [],
                summary: 'Could not parse LLM output. Manual review recommended.',
              };
              results.push(fallback);
              send({ type: 'check_result', data: fallback });
            }
          }

          // ── Material Passport ──
          send({ type: 'stage', stage: 'material_passport', message: 'Generating Material Passports...' });

          const paperListText = (papers || [])
            .map((p, i) => `${i + 1}. ${p.title} (${p.authors || 'Unknown'}, ${p.year || 'N/A'}) ${p.url || ''}`)
            .join('\n');

          const passportMessages: Message[] = [
            { role: 'system', content: MATERIAL_PASSPORT_PROMPT },
            {
              role: 'user',
              content: `Text:\n${content.substring(0, 8000)}\n\nKnown papers in this project:\n${paperListText || 'No paper list provided.'}`,
            },
          ];

          let passportResult = '';
          for await (const token of streamLLM(llm, passportMessages)) {
            passportResult += token;
          }

          const passports = parsePassports(passportResult) || [];
          send({ type: 'material_passports', data: passports });

          // Compute overall summary
          const passCount = results.filter((r) => r.status === 'PASS').length;
          const failCount = results.filter((r) => r.status === 'FAIL').length;
          const suspectedCount = results.filter((r) => r.status === 'SUSPECTED').length;

          const overallScore = Math.round(
            (passCount / FAILURE_MODES.length) * 100,
          );

          // Deep mode: zero tolerance — any FAIL = overall FAIL
          const verdict = isDeep
            ? (failCount > 0 ? 'FAIL' : suspectedCount > 0 ? 'SUSPECTED' : 'PASS')
            : (failCount > 0 ? 'FAIL' : suspectedCount > 0 ? 'SUSPECTED' : 'PASS');

          // Check passport completeness for deep mode
          const passportComplete = isDeep
            ? (papers || []).length === 0 || passports.length >= (papers || []).length * 0.8
            : true;

          const summary = {
            total_checks: FAILURE_MODES.length,
            pass: passCount,
            fail: failCount,
            suspected: suspectedCount,
            overall_score: overallScore,
            verdict,
            mode,
            material_passports: passports.length,
            passport_complete: passportComplete,
            zero_tolerance_applied: isDeep,
          };

          send({ type: 'summary', data: summary });

          // Save to project if projectId provided
          if (projectId) {
            const reportMd = generateMarkdownReport(results, summary, passports, isDeep);
            const stageName = isDeep ? 'final_integrity' : 'integrity_check';
            await prisma.academicReview.create({
              data: {
                projectId,
                stage: stageName,
                type: 'integrity_check',
                content: reportMd,
                config: JSON.stringify({
                  failure_modes: FAILURE_MODES.map((m) => m.id),
                  mode,
                  material_passports: passports,
                }),
                score: overallScore,
                verdict: summary.verdict,
              },
            });

            // Advance project stage
            const project = await prisma.academicProject.findUnique({
              where: { id: projectId },
            });
            if (project) {
              if (!isDeep && project.stage === 'integrity') {
                await prisma.academicProject.update({
                  where: { id: projectId },
                  data: { stage: 'peer_review' },
                });
              } else if (isDeep && project.stage === 'final_integrity') {
                // Only advance if all checks pass in deep mode
                if (verdict === 'PASS' && passportComplete) {
                  await prisma.academicProject.update({
                    where: { id: projectId },
                    data: { stage: 'export' },
                  });
                }
              }
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

function generateMarkdownReport(
  results: CheckResult[],
  summary: {
    total_checks: number;
    pass: number;
    fail: number;
    suspected: number;
    overall_score: number;
    verdict: string;
    mode: string;
    material_passports: number;
    passport_complete: boolean;
    zero_tolerance_applied: boolean;
  },
  passports: MaterialPassport[],
  isDeep: boolean,
): string {
  let md = `# Academic Integrity Report${isDeep ? ' (Final / Deep Check)' : ''}\n\n`;
  md += `**Overall Score:** ${summary.overall_score}/100\n`;
  md += `**Verdict:** ${summary.verdict}\n`;
  md += `**Mode:** ${summary.mode}\n`;
  if (isDeep) md += `**Zero Tolerance:** Applied — any FAIL prevents export\n`;
  md += `\n`;
  md += `| Check | Status | Confidence | Summary |\n`;
  md += `|-------|--------|------------|----------|\n`;

  for (const r of results) {
    const statusEmoji = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    md += `| ${r.mode_id} ${r.mode_name} | ${statusEmoji} ${r.status} | ${(r.confidence * 100).toFixed(0)}% | ${r.summary} |\n`;
  }

  md += `\n## Detailed Findings\n\n`;

  for (const r of results) {
    if (r.findings.length === 0) continue;
    md += `### ${r.mode_id}: ${r.mode_name} — ${r.status}\n\n`;
    for (const f of r.findings) {
      md += `- **[${f.severity.toUpperCase()}]** ${f.description}\n`;
      md += `  - Location: ${f.location}\n`;
      md += `  - Evidence: ${f.evidence}\n\n`;
    }
  }

  // Material Passports section
  if (passports.length > 0) {
    md += `\n## Material Passports\n\n`;
    md += `| Source | Type | Credibility | Recency | Support | Notes |\n`;
    md += `|--------|------|-------------|---------|---------|-------|\n`;
    for (const p of passports) {
      const credEmoji = p.credibility_rating === 'high' ? '🟢' : p.credibility_rating === 'medium' ? '🟡' : '🔴';
      md += `| ${p.title.substring(0, 40)}... | ${p.source_type} | ${credEmoji} ${p.credibility_rating} | ${p.recency} | ${p.citation_support} | ${p.notes.substring(0, 50)} |\n`;
    }
    md += `\n**Passport Completeness:** ${summary.passport_complete ? '✅ Complete' : '⚠️ Incomplete'}\n`;
  }

  return md;
}
