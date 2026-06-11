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
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Key,
  Save,
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

interface IntegrityCheck {
  category: string;
  status: 'PASS' | 'FAIL' | 'SUSPECTED';
  details: string;
  evidence?: string;
}

interface IntegrityResult {
  overall_score: number;
  checks: IntegrityCheck[];
  summary: string;
}

interface FinalIntegrityStageProps {
  projectId: string;
  defaultContent?: string;
  existingReviews: Array<{ type: string; content: string; stage?: string }>;
  onCompleted?: () => void;
  onSaved: () => void;
  savedData?: Record<string, unknown> | null;
  saveStageData?: (stage: string, data: unknown) => void;
}

export function FinalIntegrityStage({projectId, defaultContent, existingReviews, onSaved, savedData, saveStageData,
  onCompleted}: FinalIntegrityStageProps) {
  const { t } = useI18n();

  // Version management for content
  const versions = useStageVersions<string>({
    stageKey: 'final_integrity',
    savedData: savedData as Record<string, unknown> | null | undefined,
    saveStageData,
  });

  const content = versions.activeContent ?? defaultContent ?? '';

  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState('');
  const [checkResults, setCheckResults] = useState<Array<{ mode_id: string; mode_name: string; status: string; summary: string; findings: Array<{ evidence?: string }> }>>([]);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleCheck = async () => {
    if (!content.trim()) return;
    if (!llmSettings?.apiKey) { openSettings(); return; }

    setChecking(true);
    setResult(null);
    setError(null);
    setStreamContent('');
    setCheckResults([]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/integrity'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), llm: getLLMConfig(), mode: 'deep' }),
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
            if (data.type === 'token' && data.content) setStreamContent(p => p + data.content);
            else if (data.type === 'check_result') setCheckResults(prev => [...prev, data.data]);
            else if (data.type === 'summary') {
              const s = data.data;
              const checks = s.dimensions || checkResults;
              setResult({
                overall_score: s.overall_score,
                checks: checks.map((c: Record<string, unknown>) => ({
                  category: `${c.mode_id || ''} ${c.mode_name || c.category || ''}`.trim(),
                  status: c.status,
                  details: c.summary || c.details || '',
                  evidence: (c.findings as Array<{ evidence?: string }>)?.[0]?.evidence || c.evidence,
                })),
                summary: `Verdict: ${s.verdict} | Pass: ${s.pass}, Fail: ${s.fail}, Suspected: ${s.suspected}`,
              });
            }
            else if (data.type === 'error') throw new Error(data.message);
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Check failed');
    } finally {
      setChecking(false);
      abortRef.current = null;
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const md = `# Final Integrity Check\n\nScore: ${result.overall_score}/100\n\n${result.checks.map(c => `- **${c.category}**: ${c.status} 鈫?${c.details}`).join('\n')}\n\n${result.summary}`;
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'final_integrity', content: md, score: result.overall_score, stage: 'final_integrity' }),
      });
      const data = await res.json();
      if (data.success) onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'PASS') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'FAIL') return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const statusBadge = (status: string) => {
    if (status === 'PASS') return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">{t('academic.integrity.pass')}</Badge>;
    if (status === 'FAIL') return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">{t('academic.integrity.fail')}</Badge>;
    return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">{t('academic.integrity.suspected')}</Badge>;
  };

  const hasFail = result?.checks.some(c => c.status === 'FAIL');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.stage.final_integrity')}</CardTitle>
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
          <CardDescription className="text-xs">{t('academic.stage.final_integrity_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-xs">
            ?? {t('academic.final_integrity.zero_tolerance_desc')}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('academic.integrity.input_label')}</Label>
            <AIEditor
              content={content}
              onChange={(value) => versions.updateActiveContent(value)}
              placeholder={t('academic.integrity.placeholder')}
              minHeight="min-h-[120px]"
              disabled={checking}
              readOnly={!versions.editing && versions.hasVersions}
            />
            {/* Version selector */}
            {versions.versions.length > 1 && (
              <div className="mt-2">
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
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openSettings} className="text-xs h-8">
              <Key className="h-3 w-3 mr-1" />
              {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
            </Button>
            {checking ? (
              <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setChecking(false); }} className="h-8">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />{t('academic.integrity.checking')}
              </Button>
            ) : (
              <Button onClick={handleCheck} disabled={!content.trim()} size="sm" className="h-8">
                <ShieldAlert className="h-4 w-4 mr-2" />{t('academic.final_integrity.run_deep_check')}
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

      {checking && streamContent && (
        <Card>
          <CardContent className="pt-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto content-scroll">
              {streamContent}
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('academic.final_integrity.verdict')}</CardTitle>
              <Badge variant="secondary" className="text-lg px-3 py-1">{result.overall_score}/100</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.checks.map((check, i) => (
              <div key={i} className="p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(check.status)}
                    <span className="text-sm font-medium">{check.category}</span>
                  </div>
                  {statusBadge(check.status)}
                </div>
                <p className="text-xs text-muted-foreground">{check.details}</p>
                {check.evidence && <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{check.evidence}&rdquo;</p>}
              </div>
            ))}
            {result.summary && <div className="p-3 rounded-lg bg-muted/50 text-sm">{result.summary}</div>}
            <div className={`p-3 rounded-lg text-sm ${hasFail ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400' : 'bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400'}`}>
              {hasFail ? t('academic.final_integrity.fail') : t('academic.final_integrity.pass')}
            </div>
            {!hasFail && (
              !versions.editing && versions.hasVersions ? (
                <Button variant="outline" size="sm" onClick={versions.startEditing} className="h-7 text-xs px-2">
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('academic.common.edit') || '淇敼'}
                </Button>
              ) : (
                <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {t('academic.common.save') || '淇濆瓨'}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      {!result && !checking && existingReviews.filter(r => r.type === 'final_integrity' || r.stage === 'final_integrity').map((review, i) => (
        <Card key={i}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('academic.stage.final_integrity')}</CardTitle></CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">{review.content}</div>
          </CardContent>
        </Card>
      ))}

    </div>
  );
}


