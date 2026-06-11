'use client';

import { useState, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Send,
} from 'lucide-react';
import { diffChars } from 'diff';

interface AIEditorProps {
  content: string;
  onChange: (content: string) => void;
  /** Stage context (e.g., topic, paper list) to help AI understand the broader picture */
  context?: string;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
}

type ViewState = 'editing' | 'reviewing';

export function AIEditor({
  content,
  onChange,
  context,
  placeholder,
  minHeight = 'min-h-[300px]',
  disabled = false,
  readOnly = false,
  className = '',
}: AIEditorProps) {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();

  // AI panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('editing');

  // Diff state
  const [originalContent, setOriginalContent] = useState('');
  const [suggestedContent, setSuggestedContent] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleAskAI = useCallback(async () => {
    if (!instruction.trim() || !content.trim()) return;
    if (!llmSettings?.apiKey) {
      openSettings();
      return;
    }

    setGenerating(true);
    setError(null);
    setOriginalContent(content);
    setSuggestedContent('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/ai-edit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          instruction: instruction.trim(),
          context,
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
            if (data.type === 'token' && data.content) {
              collected += data.content;
              setSuggestedContent(collected);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (collected.trim()) {
        setViewState('reviewing');
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'AI editing failed');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [instruction, content, context, llmSettings, openSettings, getLLMConfig]);

  const handleAccept = useCallback(() => {
    onChange(suggestedContent);
    setViewState('editing');
    setSuggestedContent('');
    setOriginalContent('');
    setInstruction('');
  }, [suggestedContent, onChange]);

  const handleReject = useCallback(() => {
    setViewState('editing');
    setSuggestedContent('');
    setOriginalContent('');
  }, []);

  const handleRefine = useCallback(() => {
    // Keep suggestedContent as new base and ask for more edits
    setViewState('editing');
    setOriginalContent('');
    // Pre-fill instruction for refinement
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAskAI();
      }
    },
    [handleAskAI],
  );

  const renderDiff = () => {
    if (!originalContent || !suggestedContent) return null;

    const changes = diffChars(originalContent, suggestedContent);
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto font-mono content-scroll">
        {changes.map((part, i) => {
          if (part.added) {
            return (
              <span key={i} className="bg-green-500/20 text-green-700 dark:text-green-300">
                {part.value}
              </span>
            );
          }
          if (part.removed) {
            return (
              <span key={i} className="bg-red-500/20 text-red-700 dark:text-red-300 line-through">
                {part.value}
              </span>
            );
          }
          return <span key={i}>{part.value}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Main textarea */}
      <Textarea
        className={`${minHeight} font-mono text-sm leading-relaxed ${className}`}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || generating}
        readOnly={readOnly || generating}
      />

      {/* AI assistant toggle */}
      {!readOnly && (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          {/* Toggle header */}
          <button
            type="button"
            onClick={() => setPanelOpen(!panelOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('academic.ai_editor.assistant')}</span>
            </div>
            {panelOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Panel content */}
          {panelOpen && (
            <div className="px-3 pb-3 space-y-3 border-t border-border/30">
              {viewState === 'editing' ? (
                <>
                  {/* Input area */}
                  <div className="flex gap-2 pt-3">
                    <input
                      type="text"
                      className="flex-1 h-8 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('academic.ai_editor.placeholder')}
                      disabled={generating || disabled}
                    />
                    {generating ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          abortRef.current?.abort();
                          setGenerating(false);
                        }}
                        className="h-8"
                      >
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        {t('academic.ai_editor.stop')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleAskAI}
                        disabled={!instruction.trim() || !content.trim() || disabled}
                        className="h-8"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        {t('academic.ai_editor.send')}
                      </Button>
                    )}
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Streaming preview */}
                  {generating && suggestedContent && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono content-scroll">
                      {suggestedContent}
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Diff view */}
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t('academic.ai_editor.suggested_changes')}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleAccept}
                          className="h-7 text-xs px-2"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {t('academic.ai_editor.accept')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReject}
                          className="h-7 text-xs px-2"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t('academic.ai_editor.reject')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRefine}
                          className="h-7 text-xs px-2"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {t('academic.ai_editor.refine')}
                        </Button>
                      </div>
                    </div>
                    {renderDiff()}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
