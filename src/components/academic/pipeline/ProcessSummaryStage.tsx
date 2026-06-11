'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  BarChart3,
  FileText,
  ShieldCheck,
  MessageSquareText,
  Pencil,
  CheckCircle2,
  Sparkles,
  Loader2,
  Key,
  AlertCircle,
} from 'lucide-react';

interface Dimension {
  name: string;
  name_zh: string;
  score: number;
  comment: string;
}

interface SummaryData {
  project_name: string;
  dimensions: Dimension[];
  overall_score: number;
  overall_level: string;
  strengths: string[];
  improvements: string[];
  completion_report: string;
}

interface ProcessSummaryStageProps {
  projectId: string;
  projectName: string;
  topic: string | null;
  reviews: Array<{ id: string; type: string; content: string; stage?: string; score: number | null; verdict: string | null; createdAt: string }>;
  paperCount: number;
  papers: Array<{ title: string; authors: string | null; year: number | null }>;
}

export function ProcessSummaryStage({ projectId, projectName, topic, reviews, paperCount, papers }: ProcessSummaryStageProps) {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [generating, setGenerating] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const literatureReviews = reviews.filter(r => r.type === 'literature_review' || r.stage === 'review');
  const integrityChecks = reviews.filter(r => r.type === 'integrity_check' || r.stage === 'integrity');
  const peerReviews = reviews.filter(r => r.type === 'peer_review' || r.stage === 'peer_review');
  const revisions = reviews.filter(r => r.type === 'revision' || r.stage === 'revision');
  const reReviews = reviews.filter(r => r.type === 're_review' || r.stage === 're_review');
  const finalIntegrity = reviews.filter(r => r.type === 'final_integrity' || r.stage === 'final_integrity');

  const sections = [
    { icon: FileText, label: t('academic.export.include_literature'), count: literatureReviews.length, color: 'text-blue-500' },
    { icon: ShieldCheck, label: t('academic.export.include_integrity'), count: integrityChecks.length, color: 'text-green-500' },
    { icon: MessageSquareText, label: t('academic.export.include_peer_review'), count: peerReviews.length, color: 'text-purple-500' },
    { icon: Pencil, label: t('academic.export.include_revision'), count: revisions.length, color: 'text-orange-500' },
  ];

  const latestPeerReview = peerReviews[peerReviews.length - 1];
  const latestIntegrity = finalIntegrity.length > 0 ? finalIntegrity[finalIntegrity.length - 1] : integrityChecks[integrityChecks.length - 1];

  const handleGenerateSummary = async () => {
    if (!llmSettings?.apiKey) { openSettings(); return; }

    setGenerating(true);
    setError(null);
    setSummaryData(null);

    try {
      const res = await fetch(apiPath('/api/academic/summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectName,
          topic,
          papers,
          reviews: reviews.map(r => ({
            stage: r.stage || r.type,
            type: r.type,
            content: r.content.substring(0, 1000),
            score: r.score,
          })),
          llm: getLLMConfig(),
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

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
            if (data.type === 'summary_data' && data.data) {
              setSummaryData(data.data);
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Summary generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const levelLabel: Record<string, string> = {
    excellent: '🌟 Excellent',
    good: '✅ Good',
    acceptable: '⚠️ Acceptable',
    needs_work: '❌ Needs Work',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('academic.stage.process_summary')}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={openSettings} className="h-7 text-xs px-2">
              <Key className="h-3 w-3 mr-1" />
              {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
            </Button>
          </div>
          <CardDescription className="text-xs">{t('academic.stage.process_summary_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                  <p className="text-lg font-bold tabular-nums">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Paper count */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{paperCount} {t('academic.projects.papers')}</span>
          </div>

          {/* Key results */}
          {latestPeerReview && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquareText className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-medium">{t('academic.export.include_peer_review')}</span>
                {latestPeerReview.verdict && <Badge variant="outline" className="text-xs">{latestPeerReview.verdict}</Badge>}
                {latestPeerReview.score !== null && <Badge variant="secondary" className="text-xs">{latestPeerReview.score.toFixed(1)}/100</Badge>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{latestPeerReview.content}</p>
            </div>
          )}

          {latestIntegrity && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium">{t('academic.export.include_integrity')}</span>
                {latestIntegrity.score !== null && (
                  <Badge variant="secondary" className="text-xs">{latestIntegrity.score}/100</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{latestIntegrity.content}</p>
            </div>
          )}

          {/* Completion status */}
          <div className="flex flex-wrap gap-2">
            {[
              { done: literatureReviews.length > 0, label: t('academic.stage.literature') },
              { done: integrityChecks.length > 0, label: t('academic.stage.integrity') },
              { done: peerReviews.length > 0, label: t('academic.stage.peer_review') },
              { done: revisions.length > 0, label: t('academic.stage.revision') },
              { done: finalIntegrity.length > 0, label: t('academic.stage.final_integrity') },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${s.done ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {s.done ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3" />}
                {s.label}
              </div>
            ))}
          </div>

          {/* Generate LLM summary */}
          <Button
            onClick={handleGenerateSummary}
            disabled={generating || !llmSettings?.apiKey}
            size="sm"
            className="w-full"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {t('academic.summary.generate')}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {/* LLM Summary Results */}
      {summaryData && (
        <>
          {/* Overall score */}
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('academic.summary.overall')}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums">{summaryData.overall_score}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                  <Badge variant="outline" className="text-xs">
                    {levelLabel[summaryData.overall_level] || summaryData.overall_level}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 6 Dimensions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('academic.summary.dimensions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summaryData.dimensions.map((dim, i) => {
                const pct = Math.min(100, dim.score);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{dim.name_zh || dim.name}</span>
                      <span className="text-xs font-mono font-bold">{dim.score}/100</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${scoreColor(dim.score)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{dim.comment}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summaryData.strengths.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600 dark:text-green-400">{t('academic.summary.strengths')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1">
                    {summaryData.strengths.map((s, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-green-500 shrink-0">+</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {summaryData.improvements.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-600 dark:text-amber-400">{t('academic.summary.improvements')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1">
                    {summaryData.improvements.map((s, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-amber-500 shrink-0">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Completion Report */}
          {summaryData.completion_report && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('academic.summary.report')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-muted/50 text-xs leading-relaxed whitespace-pre-wrap">
                  {summaryData.completion_report}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

    </div>
  );
}
