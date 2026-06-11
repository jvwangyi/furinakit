'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM, LLMProvider } from '@/components/academic/LLMProvider';
import { ApiKeySelector } from '@/components/academic/ApiKeySelector';
import { usePersistedState } from '@/lib/hooks/use-persisted-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Lightbulb,
  Send,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
  FileText,
  X,
  Search,
  Sparkles,
  RotateCcw,
  Download,
  FolderPlus,
} from 'lucide-react';

interface RQBrief {
  research_background: string;
  research_question: string;
  methodology_hint: string;
  keywords: string[];
  optimized_query: string;
}

function AcademicBrainstormPage() {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();

  // ── State ──
  const [topic, setTopic] = usePersistedState('brainstorm:topic', '');
  const [messages, setMessages] = usePersistedState<Array<{ role: 'user' | 'assistant'; content: string }>>('brainstorm:messages', []);
  const [currentInput, setCurrentInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rqBrief, setRqBrief] = usePersistedState<RQBrief | null>('brainstorm:rqBrief', null);
  const [copied, setCopied] = useState(false);
  const [recommendedKeywords, setRecommendedKeywords] = usePersistedState<string[]>('brainstorm:keywords', []);
  const [analyzing, setAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Save to Project state ──
  const [saveProjectOpen, setSaveProjectOpen] = useState(false);
  const [projectList, setProjectList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectListLoading, setProjectListLoading] = useState(false);
  const [savingToProject, setSavingToProject] = useState(false);
  const [saveProjectSuccess, setSaveProjectSuccess] = useState(false);
  const [saveProjectError, setSaveProjectError] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Debounced keyword analysis ──
  const analyzeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTopicChange = useCallback(
    (value: string) => {
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
              } catch {
                /* skip */
              }
            }
          }
        } catch {
          /* silent */
        } finally {
          setAnalyzing(false);
        }
      }, 800);
    },
    [llmSettings, getLLMConfig],
  );

  // ── Start brainstorm ──
  const handleStartBrainstorm = async () => {
    if (!topic.trim() || !llmSettings?.apiKey) return;

    const userMsg = { role: 'user' as const, content: `I want to research: ${topic}` };
    setMessages([userMsg]);
    setStreaming(true);
    setError(null);
    setRqBrief(null);

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

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

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
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantMsg };
                return next;
              });
            } else if (data.type === 'rq_brief' && data.data) {
              setRqBrief(data.data);
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

  // ── Send follow-up message ──
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

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

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
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantMsg };
                return next;
              });
            } else if (data.type === 'rq_brief' && data.data) {
              setRqBrief(data.data);
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

  // ── Copy brief ──
  const handleCopyBrief = async () => {
    if (!rqBrief) return;
    const text = [
      t('academic.brainstorm.rq_brief'),
      '========================',
      '',
      `${t('academic.brainstorm.background')}: ${rqBrief.research_background}`,
      '',
      `${t('academic.brainstorm.research_question')}: ${rqBrief.research_question}`,
      '',
      `${t('academic.brainstorm.methodology')}: ${rqBrief.methodology_hint}`,
      '',
      `${t('academic.brainstorm.keywords')}: ${rqBrief.keywords.join(', ')}`,
      '',
      `${t('academic.brainstorm.optimized_query')}: ${rqBrief.optimized_query}`,
    ].join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback for non-HTTPS
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  // ── Export brief as markdown ──
  const handleExportBrief = () => {
    if (!rqBrief) return;
    const md = [
      `# ${t('academic.brainstorm.rq_brief')}`,
      '',
      `## ${t('academic.brainstorm.background')}`,
      rqBrief.research_background,
      '',
      `## ${t('academic.brainstorm.research_question')}`,
      rqBrief.research_question,
      '',
      `## ${t('academic.brainstorm.methodology')}`,
      rqBrief.methodology_hint,
      '',
      `## ${t('academic.brainstorm.keywords')}`,
      rqBrief.keywords.map((kw) => `- ${kw}`).join('\n'),
      '',
      `## ${t('academic.brainstorm.optimized_query')}`,
      `\`${rqBrief.optimized_query}\``,
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research-question-brief.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Save to Project ──
  const handleOpenSaveProject = async () => {
    setSaveProjectOpen(true);
    setSaveProjectSuccess(false);
    setSaveProjectError(null);
    setProjectListLoading(true);
    try {
      const res = await fetch(apiPath('/api/academic/projects'));
      const data = await res.json();
      if (data.success) {
        setProjectList(data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      } else {
        setSaveProjectError(data.error || 'Failed to load projects');
      }
    } catch (e) {
      setSaveProjectError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setProjectListLoading(false);
    }
  };

  const handleSaveToProject = async (projectId: string) => {
    if (!rqBrief) return;
    setSavingToProject(true);
    setSaveProjectError(null);
    try {
      // 1. Update project topic
      await fetch(apiPath(`/api/academic/projects/${projectId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: rqBrief.research_question }),
      });

      // 2. Create review with type "rq_brief"
      const briefMarkdown = [
        `# ${t('academic.brainstorm.rq_brief')}`,
        '',
        `## ${t('academic.brainstorm.background')}`,
        rqBrief.research_background,
        '',
        `## ${t('academic.brainstorm.research_question')}`,
        rqBrief.research_question,
        '',
        `## ${t('academic.brainstorm.methodology')}`,
        rqBrief.methodology_hint,
        '',
        `## ${t('academic.brainstorm.keywords')}`,
        rqBrief.keywords.map((kw) => `- ${kw}`).join('\n'),
        '',
        `## ${t('academic.brainstorm.optimized_query')}`,
        `\`${rqBrief.optimized_query}\``,
      ].join('\n');

      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rq_brief',
          content: briefMarkdown,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveProjectSuccess(true);
        setTimeout(() => setSaveProjectOpen(false), 1200);
      } else {
        setSaveProjectError(data.error || 'Failed to save');
      }
    } catch (e) {
      setSaveProjectError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSavingToProject(false);
    }
  };

  // ── Reset ──
  const handleReset = () => {
    setTopic('');
    setMessages([]);
    setCurrentInput('');
    setRqBrief(null);
    setError(null);
    setRecommendedKeywords([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (messages.length === 0) {
        handleStartBrainstorm();
      } else {
        handleSendMessage();
      }
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {t('academic.brainstorm.title') }
              </h1>
              <p className="text-muted-foreground text-sm">
                {t('academic.brainstorm.description') }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('academic.brainstorm.reset') }
              </Button>
            )}
            <ApiKeySelector />
          </div>
        </div>

        {/* API Key warning */}
        {!llmSettings?.apiKey && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t('academic.llm.configure') }
                </h4>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('academic.apikey_required_desc') }
              </p>
              <Button size="sm" onClick={openSettings} className="h-8 text-xs">
                <Key className="h-3.5 w-3.5 mr-1.5" />
                {t('academic.llm.configure') }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Topic Input (visible when no messages) */}
        {messages.length === 0 && llmSettings?.apiKey && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">
                  {t('academic.stage.brainstorm_desc') }
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t('academic.stage.brainstorm_desc') }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('academic.brainstorm.topic_placeholder')}
                  value={topic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && topic.trim()) handleStartBrainstorm();
                  }}
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
                    <Badge key={i} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                onClick={handleStartBrainstorm}
                disabled={!topic.trim() || streaming}
                size="sm"
              >
                {streaming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lightbulb className="h-4 w-4 mr-2" />
                )}
                {t('academic.brainstorm.start') }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="flex-1">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  if (messages.length === 0) handleStartBrainstorm();
                  else handleSendMessage();
                }}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                {t('academic.brainstorm.retry') }
              </Button>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto main-scroll">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border/50'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              {streaming && messages[messages.length - 1]?.role === 'assistant' && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-muted border border-border/50">
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </Card>
        )}

        {/* Chat Input (visible when in conversation and no RQ Brief yet) */}
        {messages.length > 0 && !rqBrief && llmSettings?.apiKey && (
          <div className="flex gap-2 mb-4">
            <Input
              ref={inputRef}
              placeholder={t('academic.brainstorm.reply_placeholder')}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || streaming}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* RQ Brief Card */}
        {rqBrief && (
          <Card className="border-primary/30 mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">
                    {t('academic.brainstorm.rq_brief') }
                  </CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyBrief}
                    className="h-7 text-xs px-2"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportBrief}
                    className="h-7 text-xs px-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('academic.brainstorm.background') }
                  </span>
                  <p className="text-sm mt-1">{rqBrief.research_background}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs font-medium text-primary">
                    {t('academic.brainstorm.research_question') }
                  </span>
                  <p className="text-sm font-medium mt-1">{rqBrief.research_question}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('academic.brainstorm.methodology') }
                  </span>
                  <p className="text-sm mt-1">{rqBrief.methodology_hint}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('academic.brainstorm.keywords') }
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {rqBrief.keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('academic.brainstorm.optimized_query') }
                  </span>
                  <p className="text-sm font-mono mt-1 p-2 bg-muted rounded">
                    {rqBrief.optimized_query}
                  </p>
                </div>
              </div>

              {/* Action buttons after brief */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleCopyBrief} className="h-8 text-xs">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {copied ? t('academic.common.copied') : t('academic.common.copy')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportBrief} className="h-8 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {t('academic.common.export')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenSaveProject} className="h-8 text-xs">
                  <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
                  {t('academic.common.save_to_project')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs ml-auto">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  {t('academic.brainstorm.reset') }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state - only when no API key configured */}
        {!llmSettings?.apiKey && messages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-1">
              {t('academic.brainstorm.title') }
            </p>
            <p className="text-sm">
              {t('academic.brainstorm.description') }
            </p>
          </div>
        )}

        {/* Save to Project Dialog */}
        <Dialog open={saveProjectOpen} onOpenChange={setSaveProjectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('academic.common.save_to_project')}</DialogTitle>
              <DialogDescription>{t('academic.common.select_project')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {saveProjectError && (
                <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                  {saveProjectError}
                </div>
              )}
              {saveProjectSuccess && (
                <div className="p-2 rounded-md bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs">
                  <Check className="h-3 w-3 inline mr-1" />
                  {t('academic.common.saved_successfully') }
                </div>
              )}
              {projectListLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : projectList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <p>{t('academic.common.no_projects_yet')}</p>
                  <p className="text-xs mt-1">{t('academic.common.create_project_first')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectList.map((proj) => (
                    <Button
                      key={proj.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleSaveToProject(proj.id)}
                      disabled={savingToProject || saveProjectSuccess}
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
      </div>
    </div>
  );
}

export default function AcademicBrainstormPageWrapper() {
  return (
    <LLMProvider>
      <AcademicBrainstormPage />
    </LLMProvider>
  );
}
