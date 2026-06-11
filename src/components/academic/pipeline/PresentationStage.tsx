'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  Presentation,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
  Save,
  FileText,
} from 'lucide-react';
import { AIEditor } from './AIEditor';

interface PresentationStageProps {
  projectId: string;
  paperContent?: string;
  onSaved?: () => void;
}

const PRESENTATION_TYPES = [
  { key: 'outline', label: 'PPT Outline', icon: '??', desc: 'Slide-by-slide outline with speaker notes' },
  { key: 'defense', label: 'Defense Prep', icon: '??', desc: 'Anticipated Q&A and defense strategy' },
  { key: 'speech', label: 'Speech Script', icon: '??', desc: 'Timed presentation speech with delivery tips' },
] as const;

export function PresentationStage({ projectId, paperContent, onSaved }: PresentationStageProps) {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [content, setContent] = useState(paperContent || '');
  const [presentationType, setPresentationType] = useState<string>('outline');
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [duration, setDuration] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (paperContent && !content) setContent(paperContent);
  }, [paperContent]);

  const handleGenerate = async () => {
    if (!content.trim() || !llmSettings?.apiKey) return;

    setGenerating(true);
    setResult('');
    setError(null);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/presentation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          presentationType,
          language,
          duration,
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
      setError(e instanceof Error ? e.message : 'Generation failed');
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
          type: 'presentation',
          content: result,
          stage: 'presentation',
          config: JSON.stringify({ presentationType, language, duration }),
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
              <Presentation className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('academic.stage.presentation')}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={openSettings} className="h-7 text-xs px-2">
              <Key className="h-3 w-3 mr-1" />
              {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
            </Button>
          </div>
          <CardDescription className="text-xs">{t('academic.stage.presentation_desc')}</CardDescription>
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
                <Label className="text-xs">{t('academic.presentation.paper_content')}</Label>
                <AIEditor
                  content={content}
                  onChange={setContent}
                  context={`Presentation type: ${presentationType}\nLanguage: ${language}\nDuration: ${duration}min`}
                  placeholder={t('academic.presentation.content_placeholder')}
                  minHeight="min-h-[160px]"
                />
              </div>

              {/* Presentation Type */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('academic.presentation.type')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESENTATION_TYPES.map(pt => (
                    <button
                      key={pt.key}
                      onClick={() => setPresentationType(pt.key)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-lg text-xs border transition-all ${
                        presentationType === pt.key
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{pt.icon}</span>
                        <span className="font-medium">{pt.label}</span>
                      </div>
                      <span className="text-[10px] opacity-70">{pt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('academic.presentation.language')}</Label>
                  <div className="flex gap-1">
                    <Button variant={language === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('en')} className="flex-1 text-xs h-7">English</Button>
                    <Button variant={language === 'zh' ? 'default' : 'outline'} size="sm" onClick={() => setLanguage('zh')} className="flex-1 text-xs h-7">中文</Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('academic.presentation.duration')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Math.max(5, Math.min(60, parseInt(e.target.value) || 15)))}
                      min={5}
                      max={60}
                      className="h-7 w-20 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-2">
                {generating ? (
                  <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setGenerating(false); }}>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('academic.presentation.stop')}
                  </Button>
                ) : (
                  <Button onClick={handleGenerate} disabled={!content.trim()} size="sm">
                    <Presentation className="h-4 w-4 mr-2" />
                    {t('academic.presentation.generate')}
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
                <span className="text-sm font-medium">{t('academic.presentation.result')}</span>
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
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto content-scroll">
              {result}
              {generating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
