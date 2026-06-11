'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AIEditor } from './AIEditor';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  RefreshCw,
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

interface ReReviewStageProps {
  projectId: string;
  existingReviews: Array<{ id: string; type: string; content: string; stage?: string; score: number | null; verdict: string | null }>;
  onCompleted?: () => void;
  onSaved: () => void;
  savedData?: Record<string, unknown> | null;
  saveStageData?: (stage: string, data: unknown) => void;
}

export function ReReviewStage({projectId, existingReviews, onSaved, savedData, saveStageData,
  onCompleted}: ReReviewStageProps) {
  const { t } = useI18n();
  const [revisedPaper, setRevisedPaper] = useState('');
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [assessing, setAssessing] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [streamingResult, setStreamingResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Version management for re-review result ──
  const versions = useStageVersions<string>({
    stageKey: 're_review',
    savedData: savedData as Record<string, unknown> | null | undefined,
    saveStageData,
  });

  const displayResult = assessing ? streamingResult : (versions.activeContent ?? '');

  const prevReviews = existingReviews.filter(r => r.type === 'peer_review' || r.stage === 'peer_review');

  const handleAssess = async () => {
    if (!revisedPaper.trim()) return;
    if (!llmSettings?.apiKey) { openSettings(); return; }

    setAssessing(true);
    setStreamingResult('');
    setError(null);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const prevReviewContent = prevReviews.length > 0 ? prevReviews[prevReviews.length - 1].content : undefined;

      const res = await fetch(apiPath('/api/academic/assess'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper: revisedPaper.trim(),
          llm: getLLMConfig(),
          previousReview: prevReviewContent,
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
      let collected = '';

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
            else if (data.type === 'eic_result') collected += `## EIC Analysis\n${data.data.topic_analysis}\n\n`;
            else if (data.type === 'reviewer_result') collected += `## Reviewer ${data.data.reviewer_id}\n${data.data.summary}\n\n`;
            else if (data.type === 're_reviewer_result') {
              const d = data.data;
              collected += `## Reviewer ${d.reviewer_id} — e-review\n`;
              if (d.concerns_addressed) {
                collected += `**Concerns Addressed:**\n`;
                for (const c of d.concerns_addressed) {
                  collected += `- ${c.concern}: ${c.status} —?{c.evidence}\n`;
                }
              }
              if (d.overall_improvement) collected += `**Overall Improvement:** ${d.overall_improvement}\n`;
              if (d.updated_recommendation) collected += `**Updated Recommendation:** ${d.updated_recommendation}\n\n`;
            }
            else if (data.type === 'devil_result') collected += `## Devil's Advocate\nRisk: ${data.data.overall_risk}\n\n`;
            else if (data.type === 'verdict') collected += `## Verdict\nScore: ${data.data.total_score}/100 —?{data.data.decision}\n`;
            else if (data.type === 'stage' && data.stage === 're_review_complete') collected += `\n---\nRe-review complete.\n`;
            else if (data.type === 'error') throw new Error(data.message);
            setStreamingResult(collected);
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
      // Save result as a new version
      if (streamingResult) {
        versions.addVersion(streamingResult);
      }
      setStreamingResult('');
      setAssessing(false);
      abortRef.current = null;
    }
  };

  const handleSave = async () => {
    if (!displayResult) return;
    setSaving(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 're_review', content: displayResult, stage: 're_review' }),
      });
      const data = await res.json();
      if (data.success) onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.stage.re_review')}</CardTitle>
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
          <CardDescription className="text-xs">{t('academic.stage.re_review_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {prevReviews.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.re_review.previous_reviews_found')}</Label>
              <div className="p-2 rounded-md bg-muted/50 text-xs">
                {prevReviews.length} {t('academic.projects.reviews')} available
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('academic.re_review.revised_paper')}</Label>
            <AIEditor
              content={revisedPaper}
              onChange={setRevisedPaper}
              context={`Previous reviews: ${prevReviews.length} available`}
              placeholder={t('academic.re_review.placeholder')}
              minHeight="min-h-[120px]"
              disabled={assessing}
              readOnly={!versions.editing && versions.hasVersions}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openSettings} className="text-xs h-8">
              <Key className="h-3 w-3 mr-1" />
              {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
            </Button>
            {assessing ? (
              <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setAssessing(false); }} className="h-8">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />{t('academic.review.stop')}
              </Button>
            ) : (
              <Button onClick={handleAssess} disabled={!revisedPaper.trim()} size="sm" className="h-8">
                <RefreshCw className="h-4 w-4 mr-2" />{t('academic.re_review.start')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {displayResult && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{t('academic.re_review.result')}</CardTitle>
              <div className="flex items-center gap-2">
                {currentStage && <Badge variant="outline" className="text-xs">{currentStage}</Badge>}
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
            </div>
          </CardHeader>
          <CardContent>
            {versions.editing ? (
              <AIEditor
                content={displayResult}
                onChange={(value) => versions.updateActiveContent(value)}
                placeholder={t('academic.re_review.result_placeholder')}
              />
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto content-scroll">
                {displayResult}
                {assessing && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
              </div>
            )}
            {!assessing && displayResult && (
              <div className="mt-3">
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!assessing && !displayResult && existingReviews.filter(r => r.type === 're_review' || r.stage === 're_review').map(review => (
        <Card key={review.id}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('academic.stage.re_review')}</CardTitle></CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 text-xs whitespace-pre-wrap max-h-[300px] overflow-y-auto content-scroll">{review.content}</div>
          </CardContent>
        </Card>
      ))}

    </div>
  );
}



