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
  Wand2,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
  Save,
  FileText,
  History,
  ChevronDown,
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
import { useStageVersions } from '@/lib/academic/useStageVersions';
import type { StageVersion } from '@/lib/academic/useStageVersions';
import { AIEditor } from './AIEditor';

interface PolishingStageProps {
  projectId: string;
  existingContent?: string;
  onSaved?: () => void;
  savedData?: Record<string, unknown> | null;
  saveStageData?: (stage: string, data: unknown) => void;
  onCompleted?: () => void;
}

const POLISH_TYPES = [
  { key: 'all', label: 'Comprehensive', icon: '?' },
  { key: 'language', label: 'Language', icon: '??' },
  { key: 'grammar', label: 'Grammar', icon: '??' },
  { key: 'academic', label: 'Academic Tone', icon: '??' },
  { key: 'style', label: 'Style', icon: '??' },
  { key: 'format', label: 'Format', icon: '??' },
] as const;

const FORMAT_STYLES = [
  { key: 'apa', label: 'APA' },
  { key: 'ieee', label: 'IEEE' },
  { key: 'gb', label: 'GB/T' },
  { key: 'mla', label: 'MLA' },
  { key: 'chicago', label: 'Chicago' },
] as const;

export function PolishingStage({projectId, existingContent, onSaved, savedData, saveStageData,
  onCompleted}: PolishingStageProps) {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [content, setContent] = useState(existingContent || '');
  const [polishType, setPolishType] = useState<string>('all');
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [formatStyle, setFormatStyle] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [streamingResult, setStreamingResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Version management for polished result
  const versions = useStageVersions<string>({
    stageKey: 'polishing',
    savedData: savedData as Record<string, unknown> | null | undefined,
    saveStageData,
  });

  const displayResult = generating ? streamingResult : (versions.activeContent ?? '');

  useEffect(() => {
    if (existingContent && !content) setContent(existingContent);
  }, [existingContent]);

  const handlePolish = async () => {
    if (!content.trim() || !llmSettings?.apiKey) return;

    setGenerating(true);
    setStreamingResult('');
    setError(null);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/polishing'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          polishType,
          language,
          formatStyle: formatStyle || undefined,
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
              setStreamingResult(prev => prev + data.content);
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
      setError(e instanceof Error ? e.message : 'Polishing failed');
    } finally {
      // Save polished content as a new version
      if (streamingResult) {
        versions.addVersion(streamingResult, { polishType, language, formatStyle });
      }
      setStreamingResult('');
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (!displayResult) return;
    try {
      await navigator.clipboard.writeText(displayResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleSave = async () => {
    if (!displayResult) return;
    setSaving(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'polishing',
          content: displayResult,
          stage: 'polishing',
          config: JSON.stringify({ polishType, language, formatStyle }),
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
              <Wand2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('academic.stage.polishing')}</CardTitle>
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
            <Button variant="outline" size="sm" onClick={openSettings} className="h-7 text-xs px-2">
              <Key className="h-3 w-3 mr-1" />
              {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
            </Button>
          </div>
          <CardDescription className="text-xs">{t('academic.stage.polishing_desc')}</CardDescription>
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
              {/* Content Input */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('academic.polishing.content_input')}</Label>
                <AIEditor
                  content={content}
                  onChange={setContent}
                  context={`Polish type: ${polishType}\nLanguage: ${language}\nFormat: ${formatStyle || 'auto'}`}
                  placeholder={t('academic.polishing.content_placeholder')}
                  minHeight="min-h-[160px]"
                />
              </div>

              {/* Polish Type */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('academic.polishing.polish_type')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {POLISH_TYPES.map(pt => (
                    <button
                      key={pt.key}
                      onClick={() => setPolishType(pt.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        polishType === pt.key
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span>{pt.icon}</span>
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('academic.polishing.language')}</Label>
                  <div className="flex gap-1">
                    <Button variant={language === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('en')} className="flex-1 text-xs h-7">English</Button>
                    <Button variant={language === 'zh' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('zh')} className="flex-1 text-xs h-7">中文</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('academic.polishing.format_style')}</Label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setFormatStyle('')}
                      className={`px-2 py-1 rounded text-xs border transition-all ${
                        !formatStyle ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/50 border-border/50 text-muted-foreground'
                      }`}
                    >
                      Auto
                    </button>
                    {FORMAT_STYLES.map(fs => (
                      <button
                        key={fs.key}
                        onClick={() => setFormatStyle(fs.key)}
                        className={`px-2 py-1 rounded text-xs border transition-all ${
                          formatStyle === fs.key ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/50 border-border/50 text-muted-foreground'
                        }`}
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-2">
                {generating ? (
                  <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setGenerating(false); }}>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('academic.polishing.stop')}
                  </Button>
                ) : (
                  <Button onClick={handlePolish} disabled={!content.trim()} size="sm">
                    <Wand2 className="h-4 w-4 mr-2" />
                    {t('academic.polishing.polish')}
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
      {(displayResult || generating) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('academic.polishing.result')}</span>
                {generating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </div>
              {displayResult && !generating && (
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
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs px-2">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
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
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {versions.editing ? (
              <AIEditor
                content={displayResult}
                onChange={(value) => versions.updateActiveContent(value)}
                context={`Polish type: ${polishType}`}
                placeholder={t('academic.polishing.content_placeholder')}
              />
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto content-scroll">
                {displayResult}
                {generating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
