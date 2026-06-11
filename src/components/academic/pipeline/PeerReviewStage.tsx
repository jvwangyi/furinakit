'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AIEditor } from './AIEditor';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Swords,
  Gavel,
  Shield,
  Save,
  Key,
  History,
  ChevronDown,
  Check,
  Pencil,

  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStageVersions } from '@/lib/academic/useStageVersions';
import type { StageVersion } from '@/lib/academic/useStageVersions';

interface EICResult {
  topic_analysis: string;
  sub_field: string;
  reviewers: Array<{ id: number; expertise: string; focus: string }>;
}

interface ReviewerResult {
  reviewer_id: number;
  expertise: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  scores: { originality: number; significance: number; rigor: number; clarity: number; reproducibility: number };
  confidence: number;
  recommendation: string;
  comments_to_authors: string;
}

interface DevilResult {
  role: string;
  potential_issues: Array<{ severity: string; description: string; suggestion: string }>;
  fatal_flaws: string[];
  missing_perspectives: string[];
  improvement_suggestions: string[];
  overall_risk: string;
}

interface VerdictResult {
  total_score: number;
  decision: string;
  weighted_scores: { originality: number; significance: number; rigor: number; clarity: number; reproducibility: number };
  reviewer_count: number;
  devil_issues_count: number;
}

interface PeerReviewStageProps {
  projectId: string;
  defaultContent?: string;
  existingReviews: Array<{ type: string; content: string; stage?: string }>;
  onCompleted?: () => void;
  onSaved: () => void;
  savedData?: Record<string, unknown> | null;
  saveStageData?: (stage: string, data: unknown) => void;
}

function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-mono font-medium">{score.toFixed(1)}</span>
    </div>
  );
}

export function PeerReviewStage({projectId, defaultContent, existingReviews, onSaved, savedData, saveStageData,
  onCompleted}: PeerReviewStageProps) {
  const { t } = useI18n();

  // ── Version management for paper text ──
  const versions = useStageVersions<string>({
    stageKey: 'peer_review',
    savedData: savedData as Record<string, unknown> | null | undefined,
    saveStageData,
  });

  const [field, setField] = useState('');
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [assessing, setAssessing] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [eicResult, setEicResult] = useState<EICResult | null>(null);
  const [reviewerResults, setReviewerResults] = useState<ReviewerResult[]>([]);
  const [devilResult, setDevilResult] = useState<DevilResult | null>(null);
  const [verdictResult, setVerdictResult] = useState<VerdictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setCurrentStage('');
    setCompletedStages(new Set());
    setEicResult(null);
    setReviewerResults([]);
    setDevilResult(null);
    setVerdictResult(null);
    setError(null);
  };

  const paperText = versions.activeContent ?? defaultContent ?? '';

  const handleAssess = async () => {
    if (!paperText.trim()) return;
    if (!llmSettings?.apiKey) { openSettings(); return; }

    reset();
    setAssessing(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/assess'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper: paperText.trim(), field: field.trim() || undefined, llm: getLLMConfig() }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'stage') setCurrentStage(data.stage);
            else if (data.type === 'eic_result') { setEicResult(data.data); setCompletedStages(p => new Set(p).add('eic')); }
            else if (data.type === 'reviewer_result') { setReviewerResults(p => [...p, data.data]); setCompletedStages(p => new Set(p).add(`reviewer_${data.data.reviewer_id}`)); }
            else if (data.type === 'devil_result') { setDevilResult(data.data); setCompletedStages(p => new Set(p).add('devil')); }
            else if (data.type === 'verdict') { setVerdictResult(data.data); setCompletedStages(p => new Set(p).add('verdict')); }
            else if (data.type === 'error') throw new Error(data.message);
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Assessment failed');
    } finally {
      setAssessing(false);
      abortRef.current = null;
    }
  };

  const handleSave = async () => {
    if (!verdictResult) return;
    setSaving(true);
    try {
      let md = `# Peer Review\n\n`;
      if (eicResult) md += `## EIC Analysis\n${eicResult.topic_analysis}\n\n`;
      for (const r of reviewerResults) {
        md += `## Reviewer ${r.reviewer_id}: ${r.expertise}\n${r.summary}\n\n`;
      }
      if (devilResult) md += `## Devil's Advocate\nRisk: ${devilResult.overall_risk}\n\n`;
      md += `## Verdict\nScore: ${verdictResult.total_score}/100 — ${verdictResult.decision}\n`;

      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'peer_review',
          content: md,
          score: verdictResult.total_score,
          verdict: verdictResult.decision,
          stage: 'peer_review',
          config: JSON.stringify({ field }),
        }),
      });
      const data = await res.json();
      if (data.success) onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const recLabel: Record<string, string> = { accept: t('academic.review.decision.accept'), minor_revision: t('academic.review.decision.minor_revision'), major_revision: t('academic.review.decision.major_revision'), reject: t('academic.review.decision.reject') };
  const existingPeerReview = existingReviews.find(r => r.stage === 'peer_review' || r.type === 'peer_review');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.stage.peer_review')}</CardTitle>
            {versions.isCompleted ? (
              <Badge variant="default" className="text-xs bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />{t('academic.common.status_completed')}</Badge>
            ) : versions.editing ? (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400"><Pencil className="h-3 w-3 mr-1" />{t('academic.common.status_editing')}</Badge>
            ) : versions.hasVersions ? (
              <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />{t('academic.common.status_editing')}</Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground"><Clock className="h-3 w-3 mr-1" />{t('academic.common.status_empty')}</Badge>
            )}
            {versions.hasVersions && (
              versions.isCompleted ? (
                <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground" onClick={() => { versions.uncompleteStage(); }}>
                  <Pencil className="h-3 w-3 mr-1" />{t('academic.common.edit') || '解锁编辑'}
                </Button>
              ) : (
                <Button variant="default" size="sm" className="h-6 text-[11px] px-2" onClick={() => { versions.completeStage(); onCompleted?.(); }}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />{t('academic.pipeline.complete_stage') || '完成此阶段'}
                </Button>
              )
            )}
          </div>
          <CardDescription className="text-xs">{t('academic.stage.peer_review_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('academic.review.paper_text')}</Label>
            <AIEditor
              content={paperText}
              onChange={(value) => versions.updateActiveContent(value)}
              context={`Field: ${field || 'General'}`}
              placeholder={t('academic.review.paper_placeholder')}
              minHeight="min-h-[120px]"
              disabled={assessing}
              readOnly={!versions.editing && versions.hasVersions}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.review.field')}</Label>
              <Input value={field} onChange={(e) => setField(e.target.value)} placeholder={t('academic.review.field_placeholder')} disabled={assessing} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.llm.settings')}</Label>
              <Button variant="outline" size="sm" onClick={openSettings} className="w-full text-xs justify-start h-8" disabled={assessing}>
                <Key className="h-3 w-3 mr-2" />
                {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {assessing ? (
              <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setAssessing(false); }}>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />{t('academic.review.stop')}
              </Button>
            ) : (
              <Button onClick={handleAssess} disabled={!paperText.trim()} size="sm">
                <Users className="h-4 w-4 mr-2" />{t('academic.review.start')}
              </Button>
            )}
            {/* Version selector */}
            {versions.versions.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 text-xs px-2" />}>
                  <History className="h-3 w-3 mr-1" />
                  {versions.activeVersion?.label || 'v1'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {versions.versions.map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => versions.switchVersion(v.id)}
                      className={v.id === versions.activeVersionId ? 'bg-primary/10' : ''}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          {v.id === versions.activeVersionId && <Check className="h-3 w-3" />}
                          <span className="font-medium">{v.label}</span>
                        </span>
                        <span className="text-muted-foreground text-[10px] ml-3">
                          {new Date(v.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {/* EIC */}
      {eicResult && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">{t('academic.review.eic_analysis')}</CardTitle>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs">{eicResult.topic_analysis}</p>
            {eicResult.sub_field && <Badge variant="secondary" className="text-xs">{eicResult.sub_field}</Badge>}
            <div className="grid gap-1.5">
              {eicResult.reviewers.map(r => (
                <div key={r.id} className="p-2 rounded-md bg-muted/50 text-xs">
                  <span className="font-medium">Reviewer {r.id}:</span> {r.expertise}
                  <p className="text-muted-foreground mt-0.5">{r.focus}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviewers */}
      {reviewerResults.map(reviewer => (
        <Card key={reviewer.reviewer_id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Reviewer {reviewer.reviewer_id}: {reviewer.expertise}</CardTitle>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs">{recLabel[reviewer.recommendation] || reviewer.recommendation}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs">{reviewer.summary}</p>
            <div className="space-y-1">
              <ScoreBar label={t('academic.review.score_originality')} score={reviewer.scores.originality} />
              <ScoreBar label={t('academic.review.score_significance')} score={reviewer.scores.significance} />
              <ScoreBar label={t('academic.review.score_rigor')} score={reviewer.scores.rigor} />
              <ScoreBar label={t('academic.review.score_clarity')} score={reviewer.scores.clarity} />
              <ScoreBar label={t('academic.review.score_reproducibility')} score={reviewer.scores.reproducibility} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">{t('academic.review.strengths')}</p>
                <ul className="text-xs space-y-0.5">
                  {reviewer.strengths.map((s, i) => <li key={i} className="flex gap-1"><span className="text-green-500">+</span>{s}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">{t('academic.review.weaknesses')}</p>
                <ul className="text-xs space-y-0.5">
                  {reviewer.weaknesses.map((w, i) => <li key={i} className="flex gap-1"><span className="text-red-500">-</span>{w}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Devil */}
      {devilResult && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm">{t('academic.review.devil_advocate')}</CardTitle>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              {devilResult.overall_risk && (
                <Badge variant="outline" className={`text-xs ${devilResult.overall_risk === 'high' ? 'border-destructive/50 text-destructive' : devilResult.overall_risk === 'medium' ? 'border-yellow-500/50 text-yellow-600' : 'border-green-500/50 text-green-600'}`}>
                  Risk: {devilResult.overall_risk}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {devilResult.potential_issues.map((issue, i) => (
              <div key={i} className={`p-2 rounded-md text-xs border ${issue.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' : issue.severity === 'major' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-muted/50 border-border/50'}`}>
                <Badge variant="outline" className="text-[10px] mb-1">{issue.severity}</Badge>
                <p>{issue.description}</p>
                {issue.suggestion && <p className="text-muted-foreground mt-0.5">→ {issue.suggestion}</p>}
              </div>
            ))}
            {devilResult.fatal_flaws.length > 0 && (
              <div>
                <p className="text-xs font-medium text-destructive mb-1">{t('academic.review.fatal_flaws')}</p>
                <ul className="text-xs space-y-0.5">
                  {devilResult.fatal_flaws.map((f, i) => <li key={i}>? {f}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verdict */}
      {verdictResult && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('academic.review.final_verdict')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums">{verdictResult.total_score}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <div className="flex-1 space-y-1">
                <ScoreBar label={t('academic.review.score_originality')} score={verdictResult.weighted_scores.originality} />
                <ScoreBar label={t('academic.review.score_significance')} score={verdictResult.weighted_scores.significance} />
                <ScoreBar label={t('academic.review.score_rigor')} score={verdictResult.weighted_scores.rigor} />
                <ScoreBar label={t('academic.review.score_clarity')} score={verdictResult.weighted_scores.clarity} />
                <ScoreBar label={t('academic.review.score_reproducibility')} score={verdictResult.weighted_scores.reproducibility} />
              </div>
              <Badge className="text-sm px-3 py-1">{verdictResult.decision}</Badge>
            </div>
            {!versions.editing && versions.hasVersions ? (
              <Button variant="outline" size="sm" onClick={versions.startEditing} className="h-7 text-xs px-2">
                <Pencil className="h-4 w-4 mr-2" />
                {t('academic.common.edit') || '修改'}
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {t('academic.common.save') || '保存'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing */}
      {!assessing && !eicResult && !verdictResult && existingPeerReview && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('academic.stage.peer_review')}</CardTitle></CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto content-scroll">{existingPeerReview.content}</div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}



