import { NextRequest } from 'next/server';
import { streamLLM, type LLMConfig, type Message } from '@/lib/academic/llm';
import { getAltKeys, streamLLMWithKeyRotation } from '@/lib/academic/llm-helpers';
import { getSessionUser } from '@/lib/auth-helpers';

interface AssessBody {
  paper: string;
  field?: string;
  projectId?: string;
  llm: LLMConfig;
  /** For re-review: the previous review content to verify against */
  previousReview?: string;
}

/** Helper: call LLM and collect full response (non-streaming inner calls). */
async function callLLMFull(config: LLMConfig, messages: Message[], altKeys: string[] = []): Promise<string> {
  let result = '';
  for await (const token of streamLLMWithKeyRotation(config, messages, altKeys)) {
    result += token;
  }
  return result;
}

// ── Layer prompts ──────────────────────────────────────────────

function eicPrompt(paperText: string, field: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are the Editor-in-Chief (EIC) of a top-tier academic journal in ${field || 'the relevant field'}.
Your job is to:
1. Analyze the paper's main topic, methodology, and contributions
2. Identify the sub-field and key themes
3. Assign 3 reviewer personas with different expertise areas:
   - Reviewer 1: Expert in methodology and experimental design
   - Reviewer 2: Expert in theoretical foundations and literature coverage
   - Reviewer 3: Expert in practical applications and reproducibility

Output your analysis in this JSON format (and ONLY this JSON, no other text):
{
  "topic_analysis": "Brief analysis of the paper's main topic and contributions",
  "sub_field": "Specific sub-field within ${field || 'the discipline'}",
  "reviewers": [
    {
      "id": 1,
      "expertise": "Methodology and Experimental Design",
      "focus": "Evaluate the rigor of the research methodology, sample size, statistical analysis, and experimental setup"
    },
    {
      "id": 2,
      "expertise": "Theoretical Foundations and Literature",
      "focus": "Evaluate the theoretical framework, literature coverage, novelty of the approach, and positioning within the field"
    },
    {
      "id": 3,
      "expertise": "Practical Applications and Reproducibility",
      "focus": "Evaluate practical significance, reproducibility of results, code/data availability, and real-world impact"
    }
  ]
}`,
    },
    {
      role: 'user',
      content: `Please analyze the following paper and assign reviewers:\n\n${paperText.substring(0, 8000)}`,
    },
  ];
}

// ── Sprint Contract Phase 1: Commit scoring plan (without seeing paper) ──

function sprintCommitPrompt(reviewerId: number, expertise: string, focus: string, field: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are Reviewer ${reviewerId}, an expert in ${expertise} in the field of ${field || 'the relevant discipline'}.
${focus}

IMPORTANT: You have NOT seen the paper yet. Your task is to commit to a scoring plan BEFORE reviewing.

Define your evaluation criteria and how you will score each dimension. This prevents post-hoc rationalization.

Output ONLY this JSON:
{
  "reviewer_id": ${reviewerId},
  "expertise": "${expertise}",
  "scoring_plan": {
    "originality": {"weight": <0.1-0.3>, "criteria": "What constitutes a 3/10 vs 7/10 vs 10/10 for originality in this field"},
    "significance": {"weight": <0.1-0.3>, "criteria": "Scoring criteria for significance"},
    "rigor": {"weight": <0.1-0.3>, "criteria": "Scoring criteria for methodological rigor"},
    "clarity": {"weight": <0.1-0.3>, "criteria": "Scoring criteria for writing clarity"},
    "reproducibility": {"weight": <0.1-0.3>, "criteria": "Scoring criteria for reproducibility"}
  },
  "special_attention": ["area 1 I will scrutinize", "area 2 I will scrutinize"],
  "commitment_hash": "Brief summary of my committed approach"
}`,
    },
    {
      role: 'user',
      content: `You are Reviewer ${reviewerId}. Before seeing the paper, commit to your scoring plan for reviewing a paper in ${field || 'your field of expertise'}. Define clear criteria for each score dimension.`,
    },
  ];
}

function reviewerPrompt(
  reviewerId: number,
  expertise: string,
  focus: string,
  paperText: string,
  eicAnalysis: string,
  scoringPlan: string,
): Message[] {
  return [
    {
      role: 'system',
      content: `You are Reviewer ${reviewerId}, an expert in ${expertise}.
${focus}

You are reviewing a paper for a top-tier journal. Be thorough, fair, and constructive.
Do NOT give all perfect scores �?differentiate quality honestly.

IMPORTANT: You previously committed to this scoring plan:
${scoringPlan}

You MUST follow your committed scoring criteria. Do not adjust the criteria after seeing the paper.

Provide your review in this JSON format (and ONLY this JSON):
{
  "reviewer_id": ${reviewerId},
  "expertise": "${expertise}",
  "summary": "2-3 sentence summary of your assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "scores": {
    "originality": <0-10>,
    "significance": <0-10>,
    "rigor": <0-10>,
    "clarity": <0-10>,
    "reproducibility": <0-10>
  },
  "confidence": <1-5>,
  "recommendation": "accept | minor_revision | major_revision | reject",
  "comments_to_authors": "Constructive feedback for the authors"
}`,
    },
    {
      role: 'user',
      content: `EIC Analysis:\n${eicAnalysis}\n\nPaper:\n${paperText.substring(0, 8000)}`,
    },
  ];
}

function devilAdvocatePrompt(paperText: string, eicAnalysis: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are the Devil's Advocate �?a critical reviewer whose job is to find every possible flaw, gap, and vulnerability in a paper.
You are NOT trying to be fair. You are trying to be thorough in finding problems.

Focus on:
- Logical fallacies or unsupported claims
- Methodological weaknesses
- Missing controls or alternative explanations
- Statistical concerns (p-hacking, multiple comparisons, sample bias)
- Overclaimed results
- Reproducibility concerns
- Ethical considerations
- Missing related work that contradicts findings

Output in this JSON format (and ONLY this JSON):
{
  "role": "Devil's Advocate",
  "counter_argument_score": <1-5>,
  "counter_argument_rationale": "Why this score �?how strong is the DA's case against the paper",
  "potential_issues": [
    {"severity": "critical|major|minor", "description": "...", "suggestion": "..."}
  ],
  "fatal_flaws": ["flaw 1", "flaw 2"],
  "missing_perspectives": ["perspective 1", "perspective 2"],
  "improvement_suggestions": ["suggestion 1", "suggestion 2"],
  "overall_risk": "high|medium|low"
}

The counter_argument_score (1-5) indicates how strong your overall case against the paper is:
1 = Weak objections, paper is solid
2 = Minor concerns, easily addressable
3 = Moderate issues worth discussing
4 = Strong objections that should change the verdict
5 = Fatal problems, paper should be rejected`,
    },
    {
      role: 'user',
      content: `EIC Analysis:\n${eicAnalysis}\n\nPaper:\n${paperText.substring(0, 8000)}`,
    },
  ];
}

// ── Re-review prompt ──────────────────────────────────────────

function reReviewPrompt(reviewerId: number, expertise: string, previousReview: string, revisedPaper: string): Message[] {
  return [
    {
      role: 'system',
      content: `You are Reviewer ${reviewerId}, an expert in ${expertise}.
You previously reviewed this paper. Now the authors have submitted a revision.

Your task is to verify whether your previous concerns have been adequately addressed.

Compare your previous review with the revised paper and assess:
1. Which concerns were fully addressed
2. Which were partially addressed
3. Which were not addressed at all
4. Whether any new issues were introduced

Output ONLY this JSON:
{
  "reviewer_id": ${reviewerId},
  "concerns_addressed": [{"concern": "original concern", "status": "fully|partially|not_addressed", "evidence": "how you know"}],
  "new_issues": ["any new issues in the revision"],
  "overall_improvement": "significant|moderate|minimal|none",
  "updated_recommendation": "accept | minor_revision | major_revision | reject",
  "updated_scores": {
    "originality": <0-10>,
    "significance": <0-10>,
    "rigor": <0-10>,
    "clarity": <0-10>,
    "reproducibility": <0-10>
  }
}`,
    },
    {
      role: 'user',
      content: `## Your Previous Review:\n${previousReview.substring(0, 4000)}\n\n## Revised Paper:\n${revisedPaper.substring(0, 8000)}`,
    },
  ];
}

interface ReviewerScores {
  originality: number;
  significance: number;
  rigor: number;
  clarity: number;
  reproducibility: number;
}

interface ReviewerResult {
  reviewer_id: number;
  expertise: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  scores: ReviewerScores;
  confidence: number;
  recommendation: string;
  comments_to_authors: string;
}

interface DevilResult {
  role: string;
  counter_argument_score?: number;
  counter_argument_rationale?: string;
  potential_issues: Array<{ severity: string; description: string; suggestion: string }>;
  fatal_flaws: string[];
  missing_perspectives: string[];
  improvement_suggestions: string[];
  overall_risk: string;
}

function parseJSON<T>(text: string): T | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** DA concession threshold: only concede if DA score >= 4 */
const DA_CONCESSION_THRESHOLD = 4;

function computeVerdict(
  reviewers: ReviewerResult[],
  devil: DevilResult | null,
): { totalScore: number; decision: string; weightedScores: ReviewerScores; daConcession: boolean } {
  const weights = [0.35, 0.35, 0.30];
  const dims: (keyof ReviewerScores)[] = ['originality', 'significance', 'rigor', 'clarity', 'reproducibility'];

  const weightedScores: ReviewerScores = { originality: 0, significance: 0, rigor: 0, clarity: 0, reproducibility: 0 };

  for (const dim of dims) {
    let weighted = 0;
    let totalWeight = 0;
    reviewers.forEach((r, i) => {
      const w = weights[i] || 0.33;
      weighted += (r.scores?.[dim] || 5) * w;
      totalWeight += w;
    });
    weightedScores[dim] = Math.round((weighted / totalWeight) * 10) / 10;
  }

  const avgDim = dims.reduce((sum, d) => sum + weightedScores[d], 0) / dims.length;
  let totalScore = Math.round(avgDim * 10);

  // Devil's advocate concession logic
  let daConcession = false;
  if (devil) {
    const daScore = devil.counter_argument_score || 3;
    daConcession = daScore >= DA_CONCESSION_THRESHOLD;

    if (daConcession) {
      // DA's case is strong enough �?reviewers must concede
      const criticalCount = devil.potential_issues?.filter((i) => i.severity === 'critical').length || 0;
      const majorCount = devil.potential_issues?.filter((i) => i.severity === 'major').length || 0;
      const penalty = criticalCount * 10 + majorCount * 5;
      totalScore = Math.max(0, totalScore - penalty);
    } else {
      // DA's case is weak �?apply reduced penalty
      const criticalCount = devil.potential_issues?.filter((i) => i.severity === 'critical').length || 0;
      const majorCount = devil.potential_issues?.filter((i) => i.severity === 'major').length || 0;
      const penalty = criticalCount * 4 + majorCount * 2;
      totalScore = Math.max(0, totalScore - penalty);
    }
  }

  let decision: string;
  if (totalScore >= 80) decision = 'Accept';
  else if (totalScore >= 65) decision = 'Minor Revision';
  else if (totalScore >= 50) decision = 'Major Revision';
  else decision = 'Reject';

  return { totalScore, decision, weightedScores, daConcession };
}

function generatePeerReviewReport(
  eicData: { topic_analysis: string; sub_field: string; reviewers: Array<{ id: number; expertise: string; focus: string }> },
  reviewers: ReviewerResult[],
  devil: DevilResult | null,
  verdict: { totalScore: number; decision: string; weightedScores: ReviewerScores; daConcession: boolean },
  sprintContracts?: Array<{ reviewer_id: number; expertise: string; scoring_plan: Record<string, unknown>; commitment_hash: string }>,
): string {
  let md = `# Peer Review Report\n\n`;
  md += `## EIC Analysis\n\n`;
  md += `**Topic:** ${eicData.topic_analysis}\n`;
  md += `**Sub-field:** ${eicData.sub_field}\n\n`;

  // Sprint Contracts
  if (sprintContracts && sprintContracts.length > 0) {
    md += `## Sprint Contracts (Pre-committed Scoring Plans)\n\n`;
    md += `> Reviewers committed to their scoring criteria BEFORE seeing the paper.\n\n`;
    for (const sc of sprintContracts) {
      md += `### Reviewer ${sc.reviewer_id}: ${sc.expertise}\n`;
      md += `**Commitment:** ${sc.commitment_hash}\n\n`;
    }
  }

  for (const r of reviewers) {
    md += `## Reviewer ${r.reviewer_id}: ${r.expertise}\n\n`;
    md += `**Summary:** ${r.summary}\n\n`;
    md += `**Strengths:**\n`;
    for (const s of r.strengths) md += `- ${s}\n`;
    md += `\n**Weaknesses:**\n`;
    for (const w of r.weaknesses) md += `- ${w}\n`;
    md += `\n**Scores:** Originality ${r.scores?.originality}/10, Significance ${r.scores?.significance}/10, Rigor ${r.scores?.rigor}/10, Clarity ${r.scores?.clarity}/10, Reproducibility ${r.scores?.reproducibility}/10\n`;
    md += `**Recommendation:** ${r.recommendation}\n`;
    md += `**Confidence:** ${r.confidence}/5\n\n`;
    if (r.comments_to_authors) md += `**Comments to Authors:** ${r.comments_to_authors}\n\n`;
  }

  if (devil) {
    md += `## Devil's Advocate\n\n`;
    md += `**Counter-Argument Score:** ${devil.counter_argument_score || 'N/A'}/5\n`;
    md += `**Rationale:** ${devil.counter_argument_rationale || 'N/A'}\n`;
    md += `**Concession Threshold:** �?{DA_CONCESSION_THRESHOLD} (reviewers concede if DA score meets threshold)\n`;
    md += `**Concession Applied:** ${verdict.daConcession ? 'Yes �?DA made a strong case' : 'No �?DA case was insufficient'}\n\n`;
    md += `**Overall Risk:** ${devil.overall_risk}\n\n`;
    if (devil.potential_issues?.length) {
      md += `**Potential Issues:**\n`;
      for (const issue of devil.potential_issues) {
        md += `- [${issue.severity.toUpperCase()}] ${issue.description}\n  - Suggestion: ${issue.suggestion}\n`;
      }
    }
    if (devil.fatal_flaws?.length) {
      md += `\n**Fatal Flaws:**\n`;
      for (const f of devil.fatal_flaws) md += `- ${f}\n`;
    }
    if (devil.improvement_suggestions?.length) {
      md += `\n**Improvement Suggestions:**\n`;
      for (const s of devil.improvement_suggestions) md += `- ${s}\n`;
    }
  }

  md += `\n## Final Verdict\n\n`;
  md += `**Score:** ${verdict.totalScore}/100\n`;
  md += `**Decision:** ${verdict.decision}\n`;
  return md;
}

export async function POST(req: NextRequest) {
  try {
    const body: AssessBody = await req.json();
    const { paper, field = '', projectId, llm, previousReview } = body;

    if (!paper || typeof paper !== 'string' || paper.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paper text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!llm?.apiKey || !llm?.provider) {
      return new Response(
        JSON.stringify({ success: false, error: 'LLM configuration (provider + apiKey) is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Get user for key rotation
    const sessionUser = await getSessionUser(req).catch(() => null);
    const userId = sessionUser?.id || '';
    const altKeys = await getAltKeys(userId, llm.provider, llm.apiKey).catch(() => []);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // ── Layer 1: EIC Analysis ──
          send({ type: 'stage', stage: 'eic', message: 'Editor-in-Chief is analyzing the paper...' });

          const eicResponse = await callLLMFull(llm, eicPrompt(paper, field), altKeys);
          const eicData = parseJSON<{
            topic_analysis: string;
            sub_field: string;
            reviewers: Array<{ id: number; expertise: string; focus: string }>;
          }>(eicResponse);

          if (!eicData) {
            send({ type: 'error', message: 'Failed to parse EIC analysis. The LLM response was not valid JSON.' });
            controller.close();
            return;
          }

          send({
            type: 'eic_result',
            data: {
              topic_analysis: eicData.topic_analysis,
              sub_field: eicData.sub_field,
              reviewers: eicData.reviewers,
            },
          });

          if (previousReview) {
            // ── RE-REVIEW MODE ──
            send({ type: 'stage', stage: 're_review', message: 'Running re-review to verify revision...' });

            const reviewerResults: ReviewerResult[] = [];
            for (const reviewer of eicData.reviewers) {
              send({
                type: 'stage',
                stage: `re_reviewer_${reviewer.id}`,
                message: `Reviewer ${reviewer.id} is verifying revision...`,
              });

              const reReviewResp = await callLLMFull(
                llm, reReviewPrompt(reviewer.id, reviewer.expertise, previousReview, paper), altKeys,
              );
              const reReviewData = parseJSON<Record<string, unknown>>(reReviewResp);

              if (reReviewData) {
                send({ type: 're_reviewer_result', data: reReviewData });
              }
            }

            // Devil's advocate for re-review
            send({ type: 'stage', stage: 're_devil', message: "Devil's Advocate checking revision..." });
            const devilResponse = await callLLMFull(llm, devilAdvocatePrompt(paper, eicResponse), altKeys);
            const devilData = parseJSON<DevilResult>(devilResponse);
            if (devilData) {
              send({ type: 'devil_result', data: devilData });
            }

            send({ type: 'stage', stage: 're_review_complete', message: 'Re-review complete.' });
            send({ type: 'done' });
            return;
          }

          // ── Sprint Contract Phase 1: Commit scoring plans ──
          send({ type: 'stage', stage: 'sprint_contract', message: 'Sprint Contract: Reviewers committing to scoring plans...' });

          const sprintContracts: Array<{ reviewer_id: number; expertise: string; scoring_plan: Record<string, unknown>; commitment_hash: string }> = [];
          for (const reviewer of eicData.reviewers) {
            const commitResponse = await callLLMFull(
              llm, sprintCommitPrompt(reviewer.id, reviewer.expertise, reviewer.focus, field), altKeys,
            );
            const commitData = parseJSON<{
              reviewer_id: number;
              expertise: string;
              scoring_plan: Record<string, unknown>;
              commitment_hash: string;
            }>(commitResponse);

            if (commitData) {
              sprintContracts.push(commitData);
              send({
                type: 'sprint_commit',
                data: {
                  reviewer_id: commitData.reviewer_id,
                  expertise: commitData.expertise,
                  commitment_hash: commitData.commitment_hash,
                },
              });
            }
          }

          // ── Layer 2: Three Reviewers (Phase 2: Score according to plan) ──
          const reviewerResults: ReviewerResult[] = [];
          for (const reviewer of eicData.reviewers) {
            const contract = sprintContracts.find((c) => c.reviewer_id === reviewer.id);
            send({
              type: 'stage',
              stage: `reviewer_${reviewer.id}`,
              message: `Reviewer ${reviewer.id} (${reviewer.expertise}) is reviewing (following committed plan)...`,
            });

            const reviewResponse = await callLLMFull(
              llm, reviewerPrompt(
                reviewer.id,
                reviewer.expertise,
                reviewer.focus,
                paper,
                eicResponse,
                contract ? JSON.stringify(contract.scoring_plan) : 'No pre-committed plan.',
              ),
            );
            const reviewData = parseJSON<ReviewerResult>(reviewResponse);

            if (reviewData) {
              reviewerResults.push(reviewData);
              send({ type: 'reviewer_result', data: reviewData });
            } else {
              send({
                type: 'reviewer_result',
                data: {
                  reviewer_id: reviewer.id,
                  expertise: reviewer.expertise,
                  summary: 'Failed to parse review. LLM response was not valid JSON.',
                  strengths: [],
                  weaknesses: [],
                  scores: { originality: 5, significance: 5, rigor: 5, clarity: 5, reproducibility: 5 },
                  confidence: 1,
                  recommendation: 'major_revision',
                  comments_to_authors: 'Review could not be completed.',
                },
              });
            }
          }

          // ── Layer 3: Devil's Advocate ──
          send({ type: 'stage', stage: 'devil', message: "Devil's Advocate is finding flaws..." });

          const devilResponse = await callLLMFull(llm, devilAdvocatePrompt(paper, eicResponse), altKeys);
          const devilData = parseJSON<DevilResult>(devilResponse);

          if (devilData) {
            send({
              type: 'devil_result',
              data: {
                ...devilData,
                concession_threshold: DA_CONCESSION_THRESHOLD,
                concession_applied: (devilData.counter_argument_score || 3) >= DA_CONCESSION_THRESHOLD,
              },
            });
          } else {
            send({
              type: 'devil_result',
              data: {
                role: "Devil's Advocate",
                counter_argument_score: 3,
                potential_issues: [],
                fatal_flaws: [],
                missing_perspectives: [],
                improvement_suggestions: [],
                overall_risk: 'unknown',
                concession_threshold: DA_CONCESSION_THRESHOLD,
                concession_applied: false,
              },
            });
          }

          // ── Layer 4: Final Verdict ──
          send({ type: 'stage', stage: 'verdict', message: 'Computing final verdict...' });

          const verdict = computeVerdict(reviewerResults, devilData);

          send({
            type: 'verdict',
            data: {
              total_score: verdict.totalScore,
              decision: verdict.decision,
              weighted_scores: verdict.weightedScores,
              reviewer_count: reviewerResults.length,
              devil_issues_count: devilData?.potential_issues?.length || 0,
              da_concession: verdict.daConcession,
              da_concession_threshold: DA_CONCESSION_THRESHOLD,
            },
          });

          // Save to project if projectId provided
          if (projectId) {
            try {
              const { prisma } = await import('@/lib/prisma');
              const reportMd = generatePeerReviewReport(eicData, reviewerResults, devilData, verdict, sprintContracts);
              await prisma.academicReview.create({
                data: {
                  projectId,
                  stage: 'peer_review',
                  type: 'peer_review',
                  content: reportMd,
                  config: JSON.stringify({
                    field,
                    sprint_contracts: sprintContracts,
                    da_concession: verdict.daConcession,
                    da_concession_threshold: DA_CONCESSION_THRESHOLD,
                  }),
                  score: verdict.totalScore,
                  verdict: verdict.decision,
                },
              });
              const project = await prisma.academicProject.findUnique({ where: { id: projectId } });
              if (project && project.stage === 'peer_review') {
                await prisma.academicProject.update({ where: { id: projectId }, data: { stage: 'revision' } });
              }
            } catch (saveErr) {
              console.error('Failed to save peer review to project:', saveErr);
            }
          }

          send({ type: 'done' });
        } catch (err) {
          send({
            type: 'error',
            message: err instanceof Error ? err.message : 'Unknown error occurred',
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
