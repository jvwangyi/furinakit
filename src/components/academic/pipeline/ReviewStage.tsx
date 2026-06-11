'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AIEditor } from './AIEditor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import { useTaskManager } from '@/lib/academic/TaskManager';
import { TaskIndicator } from '@/components/academic/TaskIndicator';
import { useStageVersions } from '@/lib/academic/useStageVersions';
import type { StageVersion } from '@/lib/academic/useStageVersions';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Copy,
  Download,
  Check,
  FileText,
  Save,
  ChevronDown,
  History,
  Trash2,
  Pencil,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Paper {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  abstract: string | null;
}

interface ReviewStageProps {
  projectId: string;
  papers: Paper[];
  existingReviews: Array<{ type: string; content: string; stage?: string }>;
  topic: string | null;
  onReviewSaved: () => void;
  savedData?: Record<string, unknown> | null;
  onCompleted?: () => void;
  saveStageData?: (stage: string, data: unknown) => void;
}

export function ReviewStage({ projectId, papers, existingReviews, topic, onReviewSaved, savedData, onCompleted, saveStageData }: ReviewStageProps) {
  const { t } = useI18n();
  const [reviewStyle, setReviewStyle] = useState<'apa' | 'ieee' | 'gb'>('apa');
  const [reviewLang, setReviewLang] = useState<'zh' | 'en'>('zh');
  const { settings: llmSettings, getLLMConfig } = useLLM();
  const { submitTask, getStageTasks, cancelTask } = useTaskManager();

  // Find existing review from DB (before hook, used as fallback)
  const existingReview = existingReviews.find(r => r.stage === 'review' || r.type === 'literature_review');

  // ── Version management via hook ──
  const versions = useStageVersions<string>({
    stageKey: 'review',
    savedData: savedData || (existingReview?.content ? { content: existingReview.content } : null),
    saveStageData,
  });

  // Cast to access refs for task function
  const versionsAny = versions as typeof versions & { persistRef: { current: (d: unknown) => void }; dataRef: { current: unknown } };

  // ── Ephemeral state ──
  const [generating, setGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeTaskRef = useRef<string | null>(null);

  // Display: streaming during generation, otherwise active version content
  const displayContent = generating ? streamingContent : (versions.activeContent ?? '');

  // ── Watch for task completion ──
  const stageTasks = getStageTasks('review');
  useEffect(() => {
    const myTaskId = activeTaskRef.current;
    if (!myTaskId) return;
    const myTask = stageTasks.find(t => t.id === myTaskId);
    if (!myTask) return;

    if (myTask.status === 'completed') {
      // Task function already saved via persistRef — just clean up
      setStreamingContent('');
      setGenerating(false);
      activeTaskRef.current = null;
    } else if (myTask.status === 'failed') {
      const errorMsg = myTask.error || 'Generation failed';
      if (!errorMsg.includes('abort') && !errorMsg.includes('Abort')) {
        setReviewError(errorMsg);
      }
      setStreamingContent('');
      setGenerating(false);
      activeTaskRef.current = null;
    } else if (myTask.status === 'cancelled') {
      setStreamingContent('');
      setGenerating(false);
      activeTaskRef.current = null;
    }
  }, [stageTasks]);

  // ── Generate ──
  const handleGenerate = async () => {
    if (!llmSettings?.apiKey) return;
    if (papers.length === 0) return;

    setStreamingContent('');
    setReviewError(null);

    const paperList = papers.map(p => ({
      title: p.title,
      authors: p.authors || '',
      year: p.year || 0,
      abstract: p.abstract || '',
    }));

    const taskId = submitTask(
      'review_generate',
      'review',
      async (_taskId, onProgress, signal) => {
        onProgress(10);

        const res = await fetch(apiPath('/api/academic/review'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic || papers[0]?.title || '',
            papers: paperList,
            style: reviewStyle,
            language: reviewLang,
            llm: getLLMConfig(),
          }),
          signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        let tokenCount = 0;

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
              if (data.type === 'token' && data.content) {
                fullContent += data.content;
                tokenCount++;
                setStreamingContent(fullContent);
                onProgress(Math.min(95, 10 + Math.floor(tokenCount / 5)));
              } else if (data.type === 'done') {
                // Stream completed
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        onProgress(100);

        // Save directly via hook ref (works even if component unmounts)
        const currentVersions = (versionsAny.dataRef.current as { versions: StageVersion<string>[] }).versions;
        const newVersionId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        versionsAny.persistRef.current({
          versions: [
            ...currentVersions,
            {
              id: newVersionId,
              content: fullContent,
              label: `v${currentVersions.length + 1}`,
              createdAt: Date.now(),
              config: { style: reviewStyle, language: reviewLang },
            },
          ],
          activeVersionId: newVersionId,
        });

        return fullContent;
      },
      { papers: paperList.map(p => p.title), style: reviewStyle, language: reviewLang },
    );

    activeTaskRef.current = taskId;
    setGenerating(true);
  };

  const handleStop = () => {
    if (activeTaskRef.current) cancelTask(activeTaskRef.current);
    setGenerating(false);
  };

  // ── Save to project reviews table ──
  const handleSave = async () => {
    if (!displayContent) return;
    setSaving(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'literature_review',
          content: displayContent,
          stage: 'review',
          config: JSON.stringify({ style: reviewStyle, language: reviewLang }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onReviewSaved();
      } else {
        setReviewError(data.error || 'Failed to save');
      }
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!displayContent) return;
    try {
      await navigator.clipboard.writeText(displayContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleExport = async (format: 'markdown' | 'docx' | 'latex') => {
    if (!displayContent) return;
    try {
      const res = await fetch(apiPath('/api/academic/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: displayContent, format, filename: 'literature-review' }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const ext = format === 'docx' ? 'docx' : format === 'latex' ? 'tex' : 'md';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `literature-review.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Export failed');
    }
  };

  // ── Quality check ──
  const [qualityChecking, setQualityChecking] = useState(false);
  const [qualityResults, setQualityResults] = useState<Array<{ dimension: string; dimension_name: string; score: number; summary: string; issues: string[]; suggestions: string[] }> | null>(null);
  const [qualityOverall, setQualityOverall] = useState<number | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  const handleQualityCheck = async () => {
    const contentToCheck = displayContent || existingReview?.content;
    if (!contentToCheck || !llmSettings?.apiKey) return;
    setQualityChecking(true);
    setQualityResults(null);
    setQualityOverall(null);
    setQualityError(null);
    try {
      const res = await fetch(apiPath('/api/academic/quality-check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToCheck, llm: getLLMConfig() }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let buffer = '';
      const results: Array<{ dimension: string; dimension_name: string; score: number; summary: string; issues: string[]; suggestions: string[] }> = [];
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
            if (data.type === 'check_result' && data.data) {
              results.push(data.data);
              setQualityResults([...results]);
            } else if (data.type === 'summary' && data.data) {
              setQualityOverall(data.data.overall_score);
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      setQualityError(e instanceof Error ? e.message : 'Quality check failed');
    } finally {
      setQualityChecking(false);
    }
  };

  const qualityScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Papers summary + controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.stage.review')}</CardTitle>
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
          <CardDescription className="text-xs">
            {t('academic.stage.review_desc')} · {papers.length} {t('academic.projects.papers')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {papers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('academic.projects.no_papers')}</p>
          ) : (
            <>
              <div className="space-y-1">
                {papers.slice(0, 5).map(p => (
                  <div key={p.id} className="text-xs text-muted-foreground truncate">• {p.title}</div>
                ))}
                {papers.length > 5 && <div className="text-xs text-muted-foreground">+{papers.length - 5} more</div>}
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">{t('academic.review.ref_guide_title')}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{t('academic.review.ref_guide_desc')}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: t('academic.review.ref_undergrad'), range: '15–25' },
                    { label: t('academic.review.ref_master'), range: '30–50' },
                    { label: t('academic.review.ref_phd'), range: '50–80+' },
                    { label: t('academic.review.ref_journal'), range: '15–30' },
                  ].map((item, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{item.label}: {item.range}</Badge>
                  ))}
                </div>
                {papers.length > 0 && (
                  <p className="text-xs mt-2">
                    {papers.length < 15
                      ? <span className="text-amber-600 dark:text-amber-400">⚠ {t('academic.review.ref_too_few')}</span>
                      : papers.length > 50
                        ? <span className="text-blue-600 dark:text-blue-400">💡 {t('academic.review.ref_too_many')}</span>
                        : <span className="text-green-600 dark:text-green-400">✓ {t('academic.review.ref_ok')}</span>}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('academic.literature.style')}</Label>
                  <div className="flex gap-1">
                    {(['apa', 'ieee', 'gb'] as const).map(s => (
                      <Button key={s} variant={reviewStyle === s ? 'default' : 'outline'} size="sm" onClick={() => setReviewStyle(s)} className="flex-1 text-xs h-7">
                        {s.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('academic.literature.language')}</Label>
                  <div className="flex gap-1">
                    <Button variant={reviewLang === 'zh' ? 'default' : 'outline'} size="sm" onClick={() => setReviewLang('zh')} className="flex-1 text-xs h-7">中文</Button>
                    <Button variant={reviewLang === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setReviewLang('en')} className="flex-1 text-xs h-7">EN</Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {generating ? (
                  <Button variant="destructive" size="sm" onClick={handleStop}>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />{t('academic.literature.stop')}
                  </Button>
                ) : (
                  <Button onClick={handleGenerate} disabled={papers.length === 0} size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />{t('academic.literature.generate')}
                  </Button>
                )}
              </div>

              <TaskIndicator stage="review" hideCancel />
            </>
          )}
        </CardContent>
      </Card>

      {reviewError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{reviewError}</div>
        </div>
      )}

      {/* Review output with version selector */}
      {(displayContent || generating) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('academic.literature.review_output')}</span>
                {generating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              {displayContent && !generating && (
                <div className="flex gap-1 items-center">
                  <div className="flex gap-1 items-center">
                    {/* Version selector */}
                    {versions.versions.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 text-xs px-2" />}>
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
                                  <span className="font-medium">{versions.getLabel(v)}</span>
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
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs px-2">
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="h-7 text-xs px-2" />}>
                        <Download className="h-3 w-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('markdown')}>Markdown</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('docx')}>DOCX</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('latex')}>LaTeX</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex gap-1 items-center">
                    {!versions.editing && versions.hasVersions ? (
                      <Button variant="outline" size="sm" onClick={versions.startEditing} className="h-7 text-xs px-2">
                        <Pencil className="h-3 w-3 mr-1" />
                        {t('academic.common.edit') || '修改'}
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
                        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                        {t('academic.common.save') || '保存'}
                      </Button>
                    )}
                    {versions.versions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => versions.activeVersionId && versions.deleteVersion(versions.activeVersionId)}
                        className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <AIEditor
              content={displayContent}
              onChange={(c) => versions.updateActiveContent(c)}
              context={`Topic: ${topic}\nPapers: ${papers.map(p => p.title).join(', ')}`}
              placeholder={t('academic.review.content_placeholder')}
              readOnly={!versions.editing && versions.hasVersions}
            />
          </CardContent>
        </Card>
      )}

      {/* Existing review fallback */}
      {!displayContent && !generating && existingReview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('academic.literature.review_output')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto content-scroll">
              {existingReview.content}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Check */}
      {(displayContent || existingReview) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('academic.review.quality_check')}</span>
              </div>
              <div className="flex items-center gap-2">
                {qualityOverall !== null && <Badge variant="secondary" className="text-sm">{qualityOverall}/100</Badge>}
                <Button variant="outline" size="sm" onClick={handleQualityCheck} disabled={qualityChecking || !llmSettings?.apiKey} className="h-7 text-xs">
                  {qualityChecking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  {t('academic.review.run_quality_check')}
                </Button>
              </div>
            </div>
          </CardHeader>
          {qualityResults && qualityResults.length > 0 && (
            <CardContent className="space-y-2">
              {qualityResults.map((dim, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{dim.dimension_name}</span>
                    <span className={`text-sm font-bold tabular-nums ${qualityScoreColor(dim.score)}`}>{dim.score}/10</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{dim.summary}</p>
                  {dim.suggestions.length > 0 && (
                    <div className="mt-1.5">
                      {dim.suggestions.map((s, j) => <p key={j} className="text-xs text-muted-foreground">? {s}</p>)}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          )}
          {qualityError && <CardContent><p className="text-xs text-destructive">{qualityError}</p></CardContent>}
        </Card>
      )}
    </div>
  );
}
