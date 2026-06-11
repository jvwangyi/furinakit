'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM, LLMProvider } from '@/components/academic/LLMProvider';
import { ApiKeySelector } from '@/components/academic/ApiKeySelector';
import { usePersistedState } from '@/lib/hooks/use-persisted-state';
import {
  MessageSquareText,
  Loader2,
  AlertCircle,
  Key,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Shield,
  Swords,
  Gavel,
  User,
  TrendingUp,
  Download,
  FolderPlus,
  Check,
  Import,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Types matching the API response ──

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
  scores: {
    originality: number;
    significance: number;
    rigor: number;
    clarity: number;
    reproducibility: number;
  };
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
  weighted_scores: {
    originality: number;
    significance: number;
    rigor: number;
    clarity: number;
    reproducibility: number;
  };
  reviewer_count: number;
  devil_issues_count: number;
}

// ── Score bar component ──

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

// ── Decision badge ──

function DecisionBadge({ decision }: { decision: string }) {
  const config: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    Accept: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
    'Minor Revision': { icon: MinusCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    'Major Revision': { icon: MinusCircle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    Reject: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  };
  const c = config[decision] || config['Major Revision'];
  const Icon = c.icon;
  return (
    <Badge className={`${c.bg} ${c.color} border text-sm px-3 py-1`}>
      <Icon className="h-4 w-4 mr-1" />
      {decision}
    </Badge>
  );
}

// ── Stage indicator ──

const STAGE_KEYS = [
  { key: 'eic', i18nKey: 'academic.review.stage.eic', icon: Shield },
  { key: 'reviewer_1', i18nKey: 'academic.review.stage.reviewer_1', icon: User },
  { key: 'reviewer_2', i18nKey: 'academic.review.stage.reviewer_2', icon: User },
  { key: 'reviewer_3', i18nKey: 'academic.review.stage.reviewer_3', icon: User },
  { key: 'devil', i18nKey: 'academic.review.stage.devil', icon: Swords },
  { key: 'verdict', i18nKey: 'academic.review.stage.verdict', icon: Gavel },
] as const;

function StageIndicator({ currentStage, completedStages, t }: { currentStage: string; completedStages: Set<string>; t: (key: string) => string }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STAGE_KEYS.map((stage, i) => {
        const isActive = currentStage === stage.key;
        const isDone = completedStages.has(stage.key);
        const Icon = stage.icon;
        return (
          <div key={stage.key} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'text-muted-foreground'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{t(stage.i18nKey)}</span>
            </div>
            {i < STAGE_KEYS.length - 1 && (
              <div className={`w-4 h-px mx-0.5 ${isDone ? 'bg-green-500/50' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AcademicReviewPage() {
  const { t } = useI18n();
  const [paperText, setPaperText] = usePersistedState('review:paperText', '');
  const [field, setField] = usePersistedState('review:field', '');
  const { settings: llmSettings, openSettings } = useLLM();
  const [assessing, setAssessing] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());
  const [eicResult, setEicResult] = usePersistedState<EICResult | null>('review:eicResult', null);
  const [reviewerResults, setReviewerResults] = usePersistedState<ReviewerResult[]>('review:reviewerResults', []);
  const [devilResult, setDevilResult] = usePersistedState<DevilResult | null>('review:devilResult', null);
  const [verdictResult, setVerdictResult] = usePersistedState<VerdictResult | null>('review:verdictResult', null);
  const [assessError, setAssessError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Export & Save to Project state
  const [exporting, setExporting] = useState<string | null>(null);
  const [saveProjectOpen, setSaveProjectOpen] = useState(false);
  const [projectList, setProjectList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectListLoading, setProjectListLoading] = useState(false);
  const [savingToProject, setSavingToProject] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Import from Project state
  const [importProjectOpen, setImportProjectOpen] = useState(false);
  const [importProjectList, setImportProjectList] = useState<Array<{ id: string; name: string }>>([]);
  const [importProjectLoading, setImportProjectLoading] = useState(false);
  const [importingPapers, setImportingPapers] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Generate markdown summary of the assessment
  const generateAssessmentMarkdown = (): string => {
    let md = `# Peer Review Assessment\n\n`;
    if (field) md += `**Field:** ${field}\n\n`;

    if (eicResult) {
      md += `## Editor-in-Chief Analysis\n\n`;
      md += `${eicResult.topic_analysis}\n\n`;
      if (eicResult.sub_field) md += `**Sub-field:** ${eicResult.sub_field}\n\n`;
      md += `### Assigned Reviewers\n\n`;
      for (const r of eicResult.reviewers) {
        md += `- **Reviewer ${r.id}:** ${r.expertise} — ${r.focus}\n`;
      }
      md += '\n';
    }

    for (const reviewer of reviewerResults) {
      md += `## Reviewer ${reviewer.reviewer_id}: ${reviewer.expertise}\n\n`;
      md += `${reviewer.summary}\n\n`;
      md += `### Scores\n\n`;
      md += `| Criterion | Score |\n|---|---|\n`;
      md += `| Originality | ${reviewer.scores.originality.toFixed(1)} |\n`;
      md += `| Significance | ${reviewer.scores.significance.toFixed(1)} |\n`;
      md += `| Rigor | ${reviewer.scores.rigor.toFixed(1)} |\n`;
      md += `| Clarity | ${reviewer.scores.clarity.toFixed(1)} |\n`;
      md += `| Reproducibility | ${reviewer.scores.reproducibility.toFixed(1)} |\n\n`;
      md += `**Recommendation:** ${recLabel[reviewer.recommendation] || reviewer.recommendation}\n\n`;
      md += `### Strengths\n\n`;
      for (const s of reviewer.strengths) md += `- ${s}\n`;
      md += `\n### Weaknesses\n\n`;
      for (const w of reviewer.weaknesses) md += `- ${w}\n`;
      if (reviewer.comments_to_authors) {
        md += `\n### Comments to Authors\n\n${reviewer.comments_to_authors}\n`;
      }
      md += '\n';
    }

    if (devilResult) {
      md += `## Devil's Advocate\n\n`;
      md += `**Overall Risk:** ${devilResult.overall_risk}\n\n`;
      if (devilResult.potential_issues.length > 0) {
        md += `### Potential Issues\n\n`;
        for (const issue of devilResult.potential_issues) {
          md += `- **[${issue.severity}]** ${issue.description}`;
          if (issue.suggestion) md += ` — *Suggestion: ${issue.suggestion}*`;
          md += '\n';
        }
        md += '\n';
      }
      if (devilResult.fatal_flaws.length > 0) {
        md += `### Fatal Flaws\n\n`;
        for (const f of devilResult.fatal_flaws) md += `- ${f}\n`;
        md += '\n';
      }
      if (devilResult.improvement_suggestions.length > 0) {
        md += `### Improvement Suggestions\n\n`;
        for (const s of devilResult.improvement_suggestions) md += `- ${s}\n`;
        md += '\n';
      }
    }

    if (verdictResult) {
      md += `## Final Verdict\n\n`;
      md += `**Total Score:** ${verdictResult.total_score} / 100\n\n`;
      md += `**Decision:** ${verdictResult.decision}\n\n`;
      md += `| Criterion | Score |\n|---|---|\n`;
      md += `| Originality | ${verdictResult.weighted_scores.originality.toFixed(1)} |\n`;
      md += `| Significance | ${verdictResult.weighted_scores.significance.toFixed(1)} |\n`;
      md += `| Rigor | ${verdictResult.weighted_scores.rigor.toFixed(1)} |\n`;
      md += `| Clarity | ${verdictResult.weighted_scores.clarity.toFixed(1)} |\n`;
      md += `| Reproducibility | ${verdictResult.weighted_scores.reproducibility.toFixed(1)} |\n\n`;
      md += `Based on ${verdictResult.reviewer_count} reviewers — ${verdictResult.devil_issues_count} issues flagged by Devil's Advocate.\n`;
    }

    return md;
  };

  const handleExportAssessment = async (format: 'markdown' | 'docx' | 'latex') => {
    const md = generateAssessmentMarkdown();
    setExporting(format);
    try {
      const res = await fetch(apiPath('/api/academic/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: md, format, filename: 'peer-review-assessment' }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const ext = format === 'docx' ? 'docx' : format === 'latex' ? 'tex' : 'md';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `peer-review-assessment.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setAssessError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleOpenSaveProject = async () => {
    setSaveProjectOpen(true);
    setSaveSuccess(false);
    setProjectListLoading(true);
    try {
      const res = await fetch(apiPath('/api/academic/projects'));
      const data = await res.json();
      if (data.success) {
        setProjectList(data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      }
    } catch {
      // ignore
    } finally {
      setProjectListLoading(false);
    }
  };

  const handleOpenImportProject = async () => {
    setImportProjectOpen(true);
    setImportError(null);
    setImportProjectLoading(true);
    try {
      const res = await fetch(apiPath('/api/academic/projects'));
      const data = await res.json();
      if (data.success) {
        setImportProjectList(data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      } else {
        setImportError(data.error || 'Failed to load projects');
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setImportProjectLoading(false);
    }
  };

  const handleImportFromProject = async (projectId: string) => {
    setImportingPapers(true);
    setImportError(null);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}`));
      const data = await res.json();
      if (data.success && data.data?.papers?.length > 0) {
        // Concatenate paper content into paperText
        const paperTexts = data.data.papers.map((p: { title: string; authors: string | null; year: number | null; abstract: string | null; url: string | null }) => {
          let text = `Title: ${p.title}`;
          if (p.authors) text += `\nAuthors: ${p.authors}`;
          if (p.year) text += `\nYear: ${p.year}`;
          if (p.abstract) text += `\nAbstract: ${p.abstract}`;
          if (p.url) text += `\nURL: ${p.url}`;
          return text;
        }).join('\n\n---\n\n');
        setPaperText(prev => prev ? prev + '\n\n---\n\n' + paperTexts : paperTexts);
        setImportProjectOpen(false);
      } else if (data.success) {
        setImportError('No papers found in this project');
      } else {
        setImportError(data.error || 'Failed to load project papers');
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setImportingPapers(false);
    }
  };

  const handleSaveToProject = async (projectId: string) => {
    const md = generateAssessmentMarkdown();
    setSavingToProject(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'peer_review',
          content: md,
          score: verdictResult?.total_score,
          verdict: verdictResult?.decision,
          config: JSON.stringify({ field }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveProjectOpen(false), 1200);
      } else {
        setAssessError(data.error || 'Failed to save');
      }
    } catch (e) {
      setAssessError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingToProject(false);
    }
  };

  const resetResults = () => {
    setCurrentStage('');
    setCompletedStages(new Set());
    setEicResult(null);
    setReviewerResults([]);
    setDevilResult(null);
    setVerdictResult(null);
    setAssessError(null);
  };

  const handleAssess = async () => {
    if (!paperText.trim()) return;
    if (!llmSettings?.apiKey) {
      openSettings();
      return;
    }

    resetResults();
    setAssessing(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/assess'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper: paperText.trim(),
          field: field.trim() || undefined,
          llm: llmSettings,
        }),
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

            if (data.type === 'stage') {
              setCurrentStage(data.stage);
            } else if (data.type === 'eic_result') {
              setEicResult(data.data);
              setCompletedStages(prev => new Set(prev).add('eic'));
            } else if (data.type === 'reviewer_result') {
              setReviewerResults(prev => [...prev, data.data]);
              setCompletedStages(prev => new Set(prev).add(`reviewer_${data.data.reviewer_id}`));
            } else if (data.type === 'devil_result') {
              setDevilResult(data.data);
              setCompletedStages(prev => new Set(prev).add('devil'));
            } else if (data.type === 'verdict') {
              setVerdictResult(data.data);
              setCompletedStages(prev => new Set(prev).add('verdict'));
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setAssessError(e instanceof Error ? e.message : 'Assessment failed');
    } finally {
      setAssessing(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setAssessing(false);
  };

  const recLabel: Record<string, string> = {
    accept: t('academic.review.decision.accept'),
    minor_revision: t('academic.review.decision.minor_revision'),
    major_revision: t('academic.review.decision.major_revision'),
    reject: t('academic.review.decision.reject'),
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('academic.review.title')}</h1>
              <p className="text-muted-foreground text-sm">{t('academic.review.description')}</p>
            </div>
          </div>
          <ApiKeySelector />
        </div>

        {/* API Key warning */}
        {!llmSettings?.apiKey && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t('academic.llm.configure') || 'Configure API Key'}
                </h4>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('academic.apikey_required_desc') || 'Please configure your LLM API key to use this feature.'}
              </p>
              <Button size="sm" onClick={openSettings} className="h-8 text-xs">
                <Key className="h-3.5 w-3.5 mr-1.5" />
                {t('academic.llm.configure') || 'Configure API Key'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Input Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('academic.review.input_title') }</CardTitle>
            <CardDescription>
              {t('academic.review.input_desc') }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('academic.review.paper_text') }</Label>
              <Textarea
                value={paperText}
                onChange={(e) => setPaperText(e.target.value)}
                placeholder={t('academic.review.paper_placeholder') }
                className="min-h-[200px] font-mono text-sm resize-y"
                disabled={assessing}
              />
              <p className="text-xs text-muted-foreground">
                {paperText.length > 0 ? `${paperText.length.toLocaleString()} characters` : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('academic.review.field') }</Label>
                <Input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder={t('academic.review.field_placeholder') }
                  disabled={assessing}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {assessing ? (
                <Button variant="destructive" onClick={handleStop}>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('academic.review.stop') }
                </Button>
              ) : (
                <Button onClick={handleAssess} disabled={!paperText.trim()}>
                  <MessageSquareText className="h-4 w-4 mr-2" />
                  {t('academic.review.start') }
                </Button>
              )}
              <Button variant="outline" onClick={handleOpenImportProject} disabled={assessing}>
                <Import className="h-4 w-4 mr-1.5" />
                {t('academic.review.import_papers')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {assessError && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="flex-1">{assessError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setAssessError(null); handleAssess(); }}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                {t('academic.common.retry') }
              </Button>
            </div>
          </div>
        )}

        {/* Results Area */}
        {(assessing || eicResult || reviewerResults.length > 0 || devilResult || verdictResult) && (
          <div className="space-y-6">
            {/* Stage Indicator */}
            <Card>
              <CardContent className="pt-4">
                <StageIndicator currentStage={currentStage} completedStages={completedStages} t={t} />
              </CardContent>
            </Card>

            {/* EIC Result */}
            {eicResult && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{t('academic.review.eic_analysis') || 'Editor-in-Chief Analysis'}</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('academic.review.topic_analysis')}</p>
                    <p className="text-sm">{eicResult.topic_analysis}</p>
                  </div>
                  {eicResult.sub_field && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('academic.review.sub_field')}</p>
                      <Badge variant="secondary">{eicResult.sub_field}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{t('academic.review.assigned_reviewers')}</p>
                    <div className="grid gap-2">
                      {eicResult.reviewers.map((r) => (
                        <div key={r.id} className="p-2 rounded-md bg-muted/50 text-xs">
                          <span className="font-medium">{t('academic.review.reviewer_prefix').replace('{id}', String(r.id))}:</span> {r.expertise}
                          <p className="text-muted-foreground mt-0.5">{r.focus}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviewer Results */}
            {reviewerResults.map((reviewer) => (
              <Card key={reviewer.reviewer_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">
                        {t('academic.review.reviewer_prefix').replace('{id}', String(reviewer.reviewer_id))}: {reviewer.expertise}
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {recLabel[reviewer.recommendation] || reviewer.recommendation}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{reviewer.summary}</p>

                  {/* Scores */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('academic.review.scores')}</p>
                    <ScoreBar label={t('academic.review.score_originality')} score={reviewer.scores.originality} />
                    <ScoreBar label={t('academic.review.score_significance')} score={reviewer.scores.significance} />
                    <ScoreBar label={t('academic.review.score_rigor')} score={reviewer.scores.rigor} />
                    <ScoreBar label={t('academic.review.score_clarity')} score={reviewer.scores.clarity} />
                    <ScoreBar label={t('academic.review.score_reproducibility')} score={reviewer.scores.reproducibility} />
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">{t('academic.review.strengths')}</p>
                      <ul className="text-xs space-y-1">
                        {reviewer.strengths.map((s, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-green-500 mt-0.5">+</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">{t('academic.review.weaknesses')}</p>
                      <ul className="text-xs space-y-1">
                        {reviewer.weaknesses.map((w, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-red-500 mt-0.5">−</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {reviewer.comments_to_authors && (
                    <div className="p-2 rounded-md bg-muted/50 text-xs">
                      <p className="font-medium mb-0.5">{t('academic.review.comments_to_authors')}</p>
                      <p className="text-muted-foreground">{reviewer.comments_to_authors}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Devil's Advocate */}
            {devilResult && (
              <Card className="border-destructive/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-base">{t('academic.review.devil_advocate') || "Devil's Advocate"}</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {devilResult.overall_risk && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          devilResult.overall_risk === 'high'
                            ? 'border-destructive/50 text-destructive'
                            : devilResult.overall_risk === 'medium'
                            ? 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400'
                            : 'border-green-500/50 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {t('academic.review.risk_prefix')}: {devilResult.overall_risk}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Potential Issues */}
                  {devilResult.potential_issues.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('academic.review.potential_issues')}</p>
                      <div className="space-y-2">
                        {devilResult.potential_issues.map((issue, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-md text-xs border ${
                              issue.severity === 'critical'
                                ? 'bg-red-500/10 border-red-500/30'
                                : issue.severity === 'major'
                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                : 'bg-muted/50 border-border/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  issue.severity === 'critical'
                                    ? 'border-red-500/50 text-red-600 dark:text-red-400'
                                    : issue.severity === 'major'
                                    ? 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400'
                                    : ''
                                }`}
                              >
                                {issue.severity}
                              </Badge>
                            </div>
                            <p>{issue.description}</p>
                            {issue.suggestion && (
                              <p className="text-muted-foreground mt-0.5">💡 {issue.suggestion}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fatal Flaws */}
                  {devilResult.fatal_flaws.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-destructive mb-1">{t('academic.review.fatal_flaws')}</p>
                      <ul className="text-xs space-y-1">
                        {devilResult.fatal_flaws.map((f, i) => (
                          <li key={i} className="flex gap-1.5">
                            <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Perspectives */}
                  {devilResult.missing_perspectives.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('academic.review.missing_perspectives')}</p>
                      <ul className="text-xs space-y-1">
                        {devilResult.missing_perspectives.map((p, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-muted-foreground">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvement Suggestions */}
                  {devilResult.improvement_suggestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('academic.review.improvement_suggestions')}</p>
                      <ul className="text-xs space-y-1">
                        {devilResult.improvement_suggestions.map((s, i) => (
                          <li key={i} className="flex gap-1.5">
                            <TrendingUp className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Final Verdict */}
            {verdictResult && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{t('academic.review.final_verdict') }</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score + Decision */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold tabular-nums">{verdictResult.total_score}</p>
                      <p className="text-xs text-muted-foreground">/ 100</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <ScoreBar label={t('academic.review.score_originality')} score={verdictResult.weighted_scores.originality} />
                      <ScoreBar label={t('academic.review.score_significance')} score={verdictResult.weighted_scores.significance} />
                      <ScoreBar label={t('academic.review.score_rigor')} score={verdictResult.weighted_scores.rigor} />
                      <ScoreBar label={t('academic.review.score_clarity')} score={verdictResult.weighted_scores.clarity} />
                      <ScoreBar label={t('academic.review.score_reproducibility')} score={verdictResult.weighted_scores.reproducibility} />
                    </div>
                    <DecisionBadge decision={verdictResult.decision} />
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{t('academic.review.based_on_reviewers').replace('{count}', String(verdictResult.reviewer_count))}</span>
                    <span>•</span>
                    <span>{t('academic.review.da_issues_count').replace('{count}', String(verdictResult.devil_issues_count))}</span>
                  </div>

                  {/* Export & Save buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline" size="sm" disabled={!!exporting} />
                        }
                      >
                        {exporting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        {t('academic.review.export') }
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExportAssessment('markdown')}>
                          Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportAssessment('docx')}>
                          DOCX
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportAssessment('latex')}>
                          LaTeX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={handleOpenSaveProject}>
                      <FolderPlus className="h-4 w-4 mr-1" />
                      {t('academic.review.save_to_project') }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Initial empty state */}
        {!assessing && !eicResult && !assessError && (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquareText className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-1">{t('academic.review.empty_title') }</p>
            <p className="text-sm">{t('academic.review.empty_desc') }</p>
          </div>
        )}
      </div>



      {/* Save to Project Dialog */}
      <Dialog open={saveProjectOpen} onOpenChange={setSaveProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('academic.review.save_to_project') }</DialogTitle>
            <DialogDescription>{t('academic.review.save_to_project_desc') }</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {saveSuccess && (
              <div className="p-2 rounded-md bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs">
                <Check className="h-3 w-3 inline mr-1" />
                {t('academic.review.saved_success') }
              </div>
            )}
            {projectListLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : projectList.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>{t('academic.literature.no_projects') }</p>
                <p className="text-xs mt-1">{t('academic.literature.no_projects_desc') }</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projectList.map((proj) => (
                  <Button
                    key={proj.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSaveToProject(proj.id)}
                    disabled={savingToProject || saveSuccess}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    {proj.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveProjectOpen(false)}>
              {t('btn.cancel') }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from Project Dialog */}
      <Dialog open={importProjectOpen} onOpenChange={setImportProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('academic.review.import_papers')}</DialogTitle>
            <DialogDescription>{t('academic.common.select_project')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {importError && (
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {importError}
              </div>
            )}
            {importProjectLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : importProjectList.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>{t('academic.literature.no_projects') }</p>
                <p className="text-xs mt-1">{t('academic.literature.no_projects_desc') }</p>
              </div>
            ) : (
              <div className="space-y-2">
                {importProjectList.map((proj) => (
                  <Button
                    key={proj.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleImportFromProject(proj.id)}
                    disabled={importingPapers}
                  >
                    <Import className="h-4 w-4 mr-2" />
                    {proj.name}
                    {importingPapers && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportProjectOpen(false)}>
              {t('btn.cancel') }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AcademicReviewPageWrapper() {
  return <LLMProvider><AcademicReviewPage /></LLMProvider>;
}
