'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  Calculator,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
  Save,
  FileText,
  Upload,
} from 'lucide-react';

interface StatisticsStageProps {
  projectId: string;
  onSaved?: () => void;
}

const ANALYSIS_TYPES = [
  { key: 'auto', label: 'Auto Detect', icon: '??' },
  { key: 'descriptive', label: 'Descriptive', icon: '??' },
  { key: 'ttest', label: 'T-Test', icon: '??' },
  { key: 'anova', label: 'ANOVA', icon: '??' },
  { key: 'regression', label: 'Regression', icon: '??' },
  { key: 'correlation', label: 'Correlation', icon: '??' },
] as const;

export function StatisticsStage({ projectId, onSaved }: StatisticsStageProps) {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [dataInput, setDataInput] = useState('');
  const [analysisType, setAnalysisType] = useState<string>('auto');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setDataInput(text);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!dataInput.trim() || !llmSettings?.apiKey) return;

    setGenerating(true);
    setResult('');
    setError(null);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/statistics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataInput,
          analysisType,
          additionalContext,
          llm: getLLMConfig(),
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
            if (data.type === 'token' && data.content) {
              setResult(prev => prev + data.content);
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
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'statistical_analysis',
          content: result,
          stage: 'statistics',
          config: JSON.stringify({ analysisType, hasData: true }),
        }),
      });
      const data = await res.json();
      if (data.success) onSaved?.();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('academic.stage.statistics')}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={openSettings} className="h-7 text-xs px-2">
              <Key className="h-3 w-3 mr-1" />
              {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
            </Button>
          </div>
          <CardDescription className="text-xs">{t('academic.stage.statistics_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!llmSettings?.apiKey ? (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('academic.llm.configure')}</h4>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">{t('academic.literature.apikey_required_desc')}</p>
                <Button size="sm" onClick={openSettings} className="h-8 text-xs">
                  <Key className="h-3.5 w-3.5 mr-1.5" />
                  {t('academic.llm.configure')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Data Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('academic.statistics.data_input')}</Label>
                  <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-6 text-xs px-2">
                    <Upload className="h-3 w-3 mr-1" />
                    {t('academic.statistics.upload_csv')}
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.json" onChange={handleFileUpload} className="hidden" />
                </div>
                <textarea
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  placeholder={t('academic.statistics.data_placeholder')}
                  className="w-full h-32 p-3 rounded-lg border border-border bg-background text-sm font-mono resize-y"
                />
              </div>

              {/* Analysis Type */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('academic.statistics.analysis_type')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ANALYSIS_TYPES.map(at => (
                    <button
                      key={at.key}
                      onClick={() => setAnalysisType(at.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        analysisType === at.key
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span>{at.icon}</span>
                      {at.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Context */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('academic.statistics.additional_context')}</Label>
                <input
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder={t('academic.statistics.context_placeholder')}
                  className="w-full h-8 px-3 rounded-lg border border-border bg-background text-xs"
                />
              </div>

              {/* Action */}
              <div className="flex gap-2">
                {generating ? (
                  <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setGenerating(false); }}>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('academic.statistics.stop')}
                  </Button>
                ) : (
                  <Button onClick={handleAnalyze} disabled={!dataInput.trim()} size="sm">
                    <Calculator className="h-4 w-4 mr-2" />
                    {t('academic.statistics.analyze')}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {/* Results */}
      {(result || generating) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('academic.statistics.report')}</span>
                {generating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              {result && !generating && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs px-2">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto content-scroll">
              {result}
              {generating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
