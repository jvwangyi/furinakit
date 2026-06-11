'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import { useStageVersions } from '@/lib/academic/useStageVersions';
import type { StageVersion } from '@/lib/academic/useStageVersions';
import {
  Lightbulb,
  Send,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
  FileText,
  Save,
  X,
  Plus,
  Search,
  Sparkles,
  Pencil,
  History,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RQBrief {
  research_background: string;
  research_question: string;
  methodology_hint: string;
  keywords: string[];
  optimized_query: string;
}

interface BrainstormStageProps {
  projectId: string;
  onSaved?: () => void;
  savedData?: Record<string, unknown> | null;
  onCompleted?: () => void;
  saveStageData?: (stage: string, data: unknown) => void;
}

export function BrainstormStage({ projectId, onSaved, savedData, onCompleted, saveStageData }: BrainstormStageProps) {
  const { t } = useI18n();
  const { settings: llmSettings, getLLMConfig } = useLLM();
  const [topic, setTopic] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true); // will be corrected in useEffect below
  const [recommendedKeywords, setRecommendedKeywords] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Version management via hook ──
  const versions = useStageVersions<RQBrief>({
    stageKey: 'brainstorm',
    savedData: savedData as Record<string, unknown> | null | undefined,
    saveStageData,
  });

  const rqBrief = versions.activeContent;

  // Set editing state based on whether we have existing content
  useEffect(() => {
    if (versions.hasVersions && rqBrief) {
      setEditing(false); // lock if we have saved content
    }
  }, []); // only on mount

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced keyword analysis when user types topic
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTopicChange = useCallback((value: string) => {
    setTopic(value);
    if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    if (value.trim().length < 3) {
      setRecommendedKeywords([]);
      return;
    }
    analyzeTimerRef.current = setTimeout(async () => {
      if (!llmSettings?.apiKey) return;
      setAnalyzing(true);
      try {
        const res = await fetch(apiPath('/api/academic/brainstorm'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: value,
            messages: [{ role: 'user', content: value }],
            llm: getLLMConfig(),
            mode: 'analyze',
          }),
        });
        if (!res.ok) return;
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'keywords' && Array.isArray(data.data)) {
                setRecommendedKeywords(data.data);
              }
            } catch { /* skip */ }
          }
        }
      } catch { /* silent */ }
      finally { setAnalyzing(false); }
    }, 800);
  }, [llmSettings]);

  const handleStartBrainstorm = async () => {
    if (!topic.trim() || !llmSettings?.apiKey) return;

    const userMsg = { role: 'user' as const, content: `I want to research: ${topic}` };
    setMessages([userMsg]);
    setStreaming(true);
    setError(null);
    setEditing(true); // enter edit mode for new brief

    try {
      const res = await fetch(apiPath('/api/academic/brainstorm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          messages: [userMsg],
          llm: getLLMConfig(),
          mode: 'brainstorm',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
              assistantMsg += data.content;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantMsg };
                return next;
              });
            } else if (data.type === 'rq_brief' && data.data) {
              versions.addVersion(data.data as RQBrief);
              setEditing(false);
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
      if (e instanceof Error) setError(e.message);
    } finally {
      setStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || streaming || !llmSettings?.apiKey) return;

    const newMessages = [...messages, { role: 'user' as const, content: currentInput }];
    setMessages(newMessages);
    setCurrentInput('');
    setStreaming(true);
    setError(null);

    try {
      const res = await fetch(apiPath('/api/academic/brainstorm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          messages: newMessages,
          llm: getLLMConfig(),
          mode: 'brainstorm',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMsg = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

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
              assistantMsg += data.content;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantMsg };
                return next;
              });
            } else if (data.type === 'rq_brief' && data.data) {
              versions.addVersion(data.data as RQBrief);
              setEditing(false);
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
      if (e instanceof Error) setError(e.message);
    } finally {
      setStreaming(false);
    }
  };

  const handleCopyBrief = async () => {
    if (!rqBrief) return;
    const text = `Research Question Brief\n========================\n\nBackground: ${rqBrief.research_background}\n\nResearch Question: ${rqBrief.research_question}\n\nMethodology: ${rqBrief.methodology_hint}\n\nKeywords: ${rqBrief.keywords.join(', ')}\n\nOptimized Query: ${rqBrief.optimized_query}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback for non-HTTPS
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleSaveBrief = async () => {
    if (!rqBrief) return;
    setSaving(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rq_brief',
          content: JSON.stringify(rqBrief, null, 2),
          stage: 'brainstorm',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved?.();
        setEditing(false); // lock after save
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleBriefFieldChange = (field: keyof RQBrief, value: string | string[]) => {
    if (!rqBrief) return;
    versions.updateActiveContent({ ...rqBrief, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* ── Topic Input ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.stage.brainstorm')}</CardTitle>
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
          <CardDescription className="text-xs">{t('academic.stage.brainstorm_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!llmSettings?.apiKey ? (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    {t('academic.llm.configure')}
                  </h4>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t('academic.literature.apikey_required_desc')}
                </p>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/academic/settings'} className="h-8 text-xs">
                  <Key className="h-3.5 w-3.5 mr-1.5" />
                  {t('academic.llm.configure')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('academic.brainstorm.topic_placeholder')}
                  value={topic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && topic.trim()) handleStartBrainstorm(); }}
                  className="pl-10"
                  disabled={streaming}
                />
                {analyzing && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Recommended Keywords */}
              {recommendedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Sparkles className="h-3 w-3 text-primary" />
                  {recommendedKeywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              )}

              {streaming ? (
                <Button variant="destructive" onClick={() => setStreaming(false)} size="sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('academic.brainstorm.stop') || '停止'}
                </Button>
              ) : (
                <Button onClick={handleStartBrainstorm} disabled={!topic.trim()} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {rqBrief ? (t('academic.brainstorm.rediscuss') || '重新讨论') : t('academic.brainstorm.start')}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {/* ── Chat Messages ── */}
      {messages.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto content-scroll">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border/50'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>
      )}

      {/* ── Chat Input ── */}
      {messages.length > 0 && !rqBrief && (
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={t('academic.brainstorm.reply_placeholder')}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            disabled={streaming}
          />
          <Button onClick={handleSendMessage} disabled={!currentInput.trim() || streaming} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── RQ Brief ── */}
      {rqBrief && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">{t('academic.brainstorm.rq_brief')}</CardTitle>
              </div>
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
                  <Button variant="ghost" size="sm" onClick={handleCopyBrief} className="h-7 text-xs px-2">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="flex gap-1 items-center">
                  {!editing && versions.hasVersions ? (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-7 text-xs px-2">
                      <Pencil className="h-3 w-3 mr-1" />
                      {t('academic.common.edit') || '修改'}
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={handleSaveBrief} disabled={saving} className="h-7 text-xs px-2">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                      {t('academic.common.save') || '保存'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('academic.brainstorm.background')}</span>
                <Textarea
                  className="text-sm mt-1 min-h-[60px]"
                  value={rqBrief.research_background}
                  onChange={(e) => handleBriefFieldChange('research_background', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-xs font-medium text-primary">{t('academic.brainstorm.research_question')}</span>
                <Textarea
                  className="text-sm font-medium mt-1 min-h-[40px] bg-transparent border-0 p-0 focus-visible:ring-0"
                  value={rqBrief.research_question}
                  onChange={(e) => handleBriefFieldChange('research_question', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('academic.brainstorm.methodology')}</span>
                <Textarea
                  className="text-sm mt-1 min-h-[80px]"
                  value={rqBrief.methodology_hint}
                  onChange={(e) => handleBriefFieldChange('methodology_hint', e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('academic.brainstorm.keywords')}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {rqBrief.keywords.map((kw, i) => (
                    <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10" onClick={() => handleBriefFieldChange('keywords', rqBrief.keywords.filter((_, j) => j !== i))}>{kw} ×</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('academic.brainstorm.optimized_query')}</span>
                <Textarea
                  className="text-sm font-mono mt-1 min-h-[40px]"
                  value={rqBrief.optimized_query}
                  onChange={(e) => handleBriefFieldChange('optimized_query', e.target.value)}
                  disabled={!editing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
