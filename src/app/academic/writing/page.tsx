'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM, LLMProvider } from '@/components/academic/LLMProvider';
import { ApiKeySelector } from '@/components/academic/ApiKeySelector';
import { usePersistedState } from '@/lib/hooks/use-persisted-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PenLine,
  Key,
  Loader2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  Download,
  RotateCcw,
  StopCircle,
  Sparkles,
  BookOpen,
  ChevronRight,
  FolderPlus,
  Import,
} from 'lucide-react';

type CitationStyle = 'apa' | 'ieee' | 'gb';
type Language = 'zh' | 'en';
type Section = 'introduction' | 'methodology' | 'results' | 'discussion' | 'conclusion' | 'full';

const SECTIONS: Section[] = ['introduction', 'methodology', 'results', 'discussion', 'conclusion'];

interface ProjectItem {
  id: string;
  name: string;
}

function AcademicWritingPage() {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();

  // ── Persisted state ──
  const [topic, setTopic] = usePersistedState('writing:topic', '');
  const [style, setStyle] = usePersistedState<CitationStyle>('writing:style', 'apa');
  const [language, setLanguage] = usePersistedState<Language>('writing:lang', 'zh');
  const [outline, setOutline] = usePersistedState('writing:outline', '');
  const [outputContent, setOutputContent] = usePersistedState('writing:output', '');
  const [currentSection, setCurrentSection] = usePersistedState<string>('writing:currentSection', '');
  const [completedSections, setCompletedSections] = usePersistedState<string[]>('writing:completedSections', []);
  const [selectedProjectId, setSelectedProjectId] = usePersistedState<string | null>('writing:projectId', null);

  // ── Ephemeral state ──
  const [step, setStep] = usePersistedState<'topic' | 'outline' | 'writing'>('writing:step', 'topic');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  // ── Save Draft state ──
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftSaveError, setDraftSaveError] = useState<string | null>(null);
  // ── Import state ──
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // ── Import content from selected project ──
  const handleImportFromProject = async (projectId: string) => {
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}`));
      const data = await res.json();
      if (data.success && data.data) {
        const project = data.data;
        // Auto-fill topic from project
        if (project.topic && !topic) {
          setTopic(project.topic);
        }
        // Build context from project papers and reviews
        let contextParts: string[] = [];
        if (project.papers?.length > 0) {
          const papersInfo = project.papers.map((p: { title: string; authors: string | null; year: number | null; abstract: string | null }) => {
            let info = `- ${p.title}`;
            if (p.authors) info += ` (${p.authors})`;
            if (p.year) info += ` [${p.year}]`;
            if (p.abstract) info += `\n  Abstract: ${p.abstract.substring(0, 200)}...`;
            return info;
          }).join('\n');
          contextParts.push(`## Project Papers\n${papersInfo}`);
        }
        if (project.reviews?.length > 0) {
          const reviewsInfo = project.reviews.map((r: { type: string; content: string }) => {
            return `### ${r.type}\n${r.content.substring(0, 500)}...`;
          }).join('\n\n');
          contextParts.push(`## Project Reviews\n${reviewsInfo}`);
        }
        if (contextParts.length > 0) {
          const existingOutline = outline ? outline + '\n\n' : '';
          setOutline(existingOutline + contextParts.join('\n\n'));
        }
      } else {
        setImportError(data.error || 'Failed to load project');
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setImporting(false);
    }
  };

  // ── Save Draft to Project ──
  const handleSaveDraft = async () => {
    if (!selectedProjectId || !outputContent) return;
    setSavingDraft(true);
    setDraftSaveError(null);
    setDraftSaved(false);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${selectedProjectId}/drafts`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic || t('academic.writing.untitled_draft'),
          content: outputContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 3000);
      } else {
        setDraftSaveError(data.error || 'Failed to save draft');
      }
    } catch (e) {
      setDraftSaveError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSavingDraft(false);
    }
  };

  // ── Load projects ──
  const loadProjects = useCallback(async () => {
    if (projectsLoaded) return;
    try {
      const res = await fetch(apiPath('/api/academic/projects'));
      const data = await res.json();
      if (data.success) {
        setProjectList(data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      }
    } catch {
      /* ignore */
    } finally {
      setProjectsLoaded(true);
    }
  }, [projectsLoaded]);

  // ── Generate outline ──
  const handleGenerateOutline = async () => {
    if (!topic.trim() || !llmSettings?.apiKey) return;

    setGenerating(true);
    setError(null);
    setOutline('');

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const body: Record<string, unknown> = {
        topic,
        section: 'full',
        style,
        language,
        llm: getLLMConfig(),
      };
      if (selectedProjectId) {
        body.projectId = selectedProjectId;
      }

      const res = await fetch(apiPath('/api/academic/writing'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      let content = '';

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
              content += data.content;
              setOutline(content);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setStep('outline');
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  // ── Write (full or section) ──
  const handleWrite = async (section: Section) => {
    if (!topic.trim() || !llmSettings?.apiKey) return;

    setGenerating(true);
    setError(null);
    setCurrentSection(section);
    if (section === 'full') {
      setOutputContent('');
      setCompletedSections([]);
    }

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const body: Record<string, unknown> = {
        topic,
        section,
        outline,
        style,
        language,
        llm: getLLMConfig(),
      };
      if (selectedProjectId) {
        body.projectId = selectedProjectId;
      }

      const res = await fetch(apiPath('/api/academic/writing'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      let sectionContent = '';

      if (section === 'full') {
        // Full paper mode: accumulate into outputContent
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
                sectionContent += data.content;
                setOutputContent(sectionContent);
              } else if (data.type === 'done') {
                // Section done
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } else {
        // Single section mode: append to outputContent
        const prevContent = outputContent;
        const separator = prevContent ? '\n\n' : '';
        sectionContent = prevContent + separator;

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
                sectionContent += data.content;
                setOutputContent(sectionContent);
              } else if (data.type === 'done') {
                setCompletedSections((prev) => [...prev, section]);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        setCompletedSections((prev) => prev.includes(section) ? prev : [...prev, section]);
      }

      setStep('writing');
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Writing failed');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  // ── Stop generation ──
  const handleStop = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

  // ── Copy ──
  const handleCopy = async () => {
    if (!outputContent) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(outputContent);
      } else {
        const ta = document.createElement('textarea');
        ta.value = outputContent;
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

  // ── Export ──
  const handleExport = async (format: 'markdown' | 'docx' | 'latex') => {
    if (!outputContent) return;
    try {
      const filename = `paper-${topic.replace(/\s+/g, '-').substring(0, 40) || 'untitled'}`;
      const res = await fetch(apiPath('/api/academic/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: outputContent, format, filename }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errData.error || 'Export failed');
      }
      const blob = await res.blob();
      const ext = format === 'docx' ? 'docx' : format === 'latex' ? 'tex' : 'md';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    }
  };

  // ── Reset ──
  const handleReset = () => {
    setTopic('');
    setOutline('');
    setOutputContent('');
    setCurrentSection('');
    setCompletedSections([]);
    setSelectedProjectId(null);
    setStep('topic');
    setError(null);
  };

  const getSectionLabel = (s: string) => {
    const key = `academic.writing.section.${s}` as const;
    return t(key) || s;
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PenLine className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{t('academic.writing.title')}</h1>
              <p className="text-muted-foreground text-sm">{t('academic.writing.description')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {step !== 'topic' && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('academic.writing.reset')}
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
                  {t('academic.llm.configure')}
                </h4>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('academic.apikey_required_desc')}
              </p>
              <Button size="sm" onClick={openSettings} className="h-8 text-xs">
                <Key className="h-3.5 w-3.5 mr-1.5" />
                {t('academic.llm.configure')}
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
                  if (step === 'outline') handleGenerateOutline();
                  else if (step === 'writing' && currentSection) handleWrite(currentSection as Section);
                }}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                {t('academic.writing.retry') }
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-7 text-xs text-destructive hover:text-destructive">
                {t('academic.writing.dismiss')}
              </Button>
            </div>
          </div>
        )}

        
        {step === 'topic' && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{t('academic.writing.step1_title')}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t('academic.writing.step1_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Topic */}
              <div className="space-y-2">
                <Label className="text-xs">{t('academic.writing.topic')}</Label>
                <Input
                  placeholder={t('academic.writing.topic_placeholder')}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={generating}
                />
              </div>

              {/* Citation Style */}
              <div className="space-y-2">
                <Label className="text-xs">{t('academic.writing.citation_style')}</Label>
                <div className="flex gap-1">
                  {(['apa', 'ieee', 'gb'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={style === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStyle(s)}
                      className="flex-1 text-xs"
                    >
                      {s === 'gb' ? 'GB/T 7714' : s.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label className="text-xs">{t('academic.writing.language')}</Label>
                <div className="flex gap-1">
                  <Button
                    variant={language === 'zh' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('zh')}
                    className="flex-1 text-xs"
                  >{t('academic.common.chinese')}</Button>
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className="flex-1 text-xs"
                  >{t('academic.common.english')}</Button>
                </div>
              </div>

              {/* Project import (optional) */}
              <div className="space-y-2">
                <Label className="text-xs">{t('academic.writing.import_project')}</Label>
                <div className="flex gap-2">
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    onFocus={loadProjects}
                    className="flex-1 h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                  >
                    <option value="">{t('academic.writing.no_project')}</option>
                    {projectList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedProjectId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImportFromProject(selectedProjectId)}
                      disabled={importing}
                      className="h-9 text-xs"
                    >
                      {importing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Import className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {t('academic.common.import_from_project')}
                    </Button>
                  )}
                </div>
                {selectedProjectId && (
                  <p className="text-xs text-muted-foreground">{t('academic.writing.project_hint')}</p>
                )}
                {importError && (
                  <p className="text-xs text-destructive">{importError}</p>
                )}
              </div>

              {/* Generate Outline button */}
              <div className="flex gap-2 pt-2">
                {generating ? (
                  <Button variant="destructive" onClick={handleStop}>
                    <StopCircle className="h-4 w-4 mr-2" />
                    {t('academic.writing.stop')}
                  </Button>
                ) : (
                  <Button onClick={handleGenerateOutline} disabled={!topic.trim() || !llmSettings?.apiKey}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('academic.writing.generate_outline')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        
        {step === 'outline' && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{t('academic.writing.step2_title')}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t('academic.writing.step2_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Outline editor */}
              <div className="space-y-2">
                <Label className="text-xs">{t('academic.writing.outline')}</Label>
                <Textarea
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  disabled={generating}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder={t('academic.writing.outline_placeholder')}
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {generating ? (
                  <Button variant="destructive" onClick={handleStop}>
                    <StopCircle className="h-4 w-4 mr-2" />
                    {t('academic.writing.stop')}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => handleWrite('full')} disabled={!outline.trim()}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('academic.writing.write_full')}
                    </Button>
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground mb-2">{t('academic.writing.or_write_sections')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SECTIONS.map((s) => (
                          <Button
                            key={s}
                            variant={completedSections.includes(s) ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleWrite(s)}
                            disabled={generating}
                            className="text-xs"
                          >
                            {completedSections.includes(s) && <Check className="h-3 w-3 mr-1" />}
                            {getSectionLabel(s)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Back to topic */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('topic')}
                disabled={generating}
                className="text-xs text-muted-foreground"
              >
                �?{t("academic.writing.back_to_settings")}
              </Button>
            </CardContent>
          </Card>
        )}

        
        {step === 'writing' && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">{t('academic.writing.step3_title')}</CardTitle>
                  {generating && currentSection && (
                    <Badge variant="secondary" className="text-xs">
                      {getSectionLabel(currentSection)}
                      <Loader2 className="h-3 w-3 animate-spin ml-1" />
                    </Badge>
                  )}
                </div>
                {outputContent && !generating && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
                      {copied ? (
                        <><Check className="h-3 w-3 mr-1" /> {t('academic.writing.copied')}</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" /> {t('academic.writing.copy')}</>
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="sm" className="h-7 text-xs" />
                        }
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {t('academic.writing.export')}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExport('markdown')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('docx')}>
                          <FileText className="h-4 w-4 mr-2" />
                          DOCX
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('latex')}>
                          <FileText className="h-4 w-4 mr-2" />
                          LaTeX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              <CardDescription className="text-xs">
                {t('academic.writing.step3_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Writing content */}
              <div
                ref={outputRef}
                className="p-4 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto main-scroll prose prose-sm dark:prose-invert max-w-none"
              >
                {outputContent || (
                  <span className="text-muted-foreground">{t('academic.writing.empty_output')}</span>
                )}
                {generating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
              </div>

              {/* Section controls (when in section mode) */}
              {!generating && completedSections.length > 0 && completedSections.length < SECTIONS.length && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{t('academic.writing.write_more_sections')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SECTIONS.filter((s) => !completedSections.includes(s)).map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        onClick={() => handleWrite(s)}
                        className="text-xs"
                      >
                        <ChevronRight className="h-3 w-3 mr-1" />
                        {getSectionLabel(s)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {generating ? (
                  <Button variant="destructive" onClick={handleStop}>
                    <StopCircle className="h-4 w-4 mr-2" />
                    {t('academic.writing.stop')}
                  </Button>
                ) : (
                  <>
                    {outputContent && (
                      <>
                        <Button variant="outline" onClick={() => setStep('outline')}>
                          <FileText className="h-4 w-4 mr-2" />
                          {t('academic.writing.edit_outline')}
                        </Button>
                        <Button variant="outline" onClick={() => handleWrite('full')}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          {t('academic.writing.regenerate')}
                        </Button>
                        {selectedProjectId && (
                          <Button
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={savingDraft}
                          >
                            {savingDraft ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : draftSaved ? (
                              <Check className="h-4 w-4 mr-2" />
                            ) : (
                              <FolderPlus className="h-4 w-4 mr-2" />
                            )}
                            {draftSaved
                              ? (t('academic.review.saved_success') || 'Saved!')
                              : t('academic.writing.save_draft')}
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
                {draftSaveError && (
                  <p className="text-xs text-destructive">{draftSaveError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!llmSettings?.apiKey && step === 'topic' && (
          <div className="text-center py-16 text-muted-foreground">
            <PenLine className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-1">{t('academic.writing.title')}</p>
            <p className="text-sm">{t('academic.writing.description')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcademicWritingPageWrapper() {
  return (
    <LLMProvider>
      <AcademicWritingPage />
    </LLMProvider>
  );
}
