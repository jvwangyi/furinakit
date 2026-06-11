'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AIEditor } from './AIEditor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import { useStageVersions } from '@/lib/academic/useStageVersions';
import type { StageVersion } from '@/lib/academic/useStageVersions';
import {
  PenLine,
  Loader2,
  AlertCircle,
  Key,
  Copy,
  Check,
  FileText,
  Save,
  List,
  ChevronDown,
  History,
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

type Section = 'introduction' | 'methodology' | 'results' | 'discussion' | 'conclusion' | 'full';

const SECTIONS: { key: Section; labelKey: string }[] = [
  { key: 'introduction', labelKey: 'academic.writing.section.introduction' },
  { key: 'methodology', labelKey: 'academic.writing.section.methodology' },
  { key: 'results', labelKey: 'academic.writing.section.results' },
  { key: 'discussion', labelKey: 'academic.writing.section.discussion' },
  { key: 'conclusion', labelKey: 'academic.writing.section.conclusion' },
  { key: 'full', labelKey: 'academic.writing.section.full' },
];

interface Paper {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  abstract: string | null;
}

interface WritingStageProps {
  projectId: string;
  papers: Paper[];
  existingReviews: Array<{ type: string; content: string; stage?: string }>;
  topic: string | null;
  outline?: string;
  onSaved: () => void;
  savedData?: Record<string, unknown> | null;
  onCompleted?: () => void;
  saveStageData?: (stage: string, data: unknown) => void;
}

export function WritingStage({ projectId, papers, existingReviews, topic, outline: initialOutline, onSaved, savedData, onCompleted, saveStageData }: WritingStageProps) {
  const { t } = useI18n();
  const [writingStyle, setWritingStyle] = useState<'apa' | 'ieee' | 'gb'>('apa');
  const [writingLang, setWritingLang] = useState<'zh' | 'en'>('zh');
  const { settings: llmSettings, getLLMConfig } = useLLM();
  const [generating, setGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('full');
  const [outline, setOutline] = useState(initialOutline || '');
  const [outlineGenerated, setOutlineGenerated] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [sectionContent, setSectionContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // 鈹€鈹€ Version management via hook 鈹€鈹€
  const versions = useStageVersions<string>({
    stageKey: 'writing',
    savedData: savedData as Record<string, unknown> | null | undefined,
    saveStageData,
  });

  // Per-section stored content
  const [sectionContents, setSectionContents] = useState<Record<string, string>>({});
  const sectionContentsRef = useRef(sectionContents);
  useEffect(() => { sectionContentsRef.current = sectionContents; }, [sectionContents]);

  // Migrate legacy savedData into version format + load sectionContents
  useEffect(() => {
    if (versions.hasVersions) return;
    const sd = savedData as Record<string, unknown> | null | undefined;
    if (!sd) return;
    const legacyOutline = sd.outline as string | undefined;
    const legacySections = sd.sections as Record<string, string> | undefined;
    if (legacySections && typeof legacySections === 'object') {
      setSectionContents(legacySections);
      if (legacyOutline) {
        setOutline(legacyOutline);
        setOutlineGenerated(true);
      }
      versions.addVersion(legacySections as unknown as string, { sections: Object.keys(legacySections) }, 'v1 (migrated)');
    }
  }, [savedData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync sectionContents from active version when version switches
  useEffect(() => {
    if (!versions.hasVersions) return;
    const v = versions.activeVersion;
    if (!v) return;
    const cfg = v.config as Record<string, unknown> | undefined;
    const versionSections = cfg?.sections;
    if (Array.isArray(versionSections)) {
      // This version has section mapping: content is the section map object
      // Only sync if content looks like a section map (object, not string)
      // Actually, content IS string per hook type, but we store it as-is
    }
    // For simplicity: don't auto-sync on version switch
    // The user can see the version label and the editor shows current section
  }, [versions.activeVersionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateOutline = async () => {
    if (!llmSettings?.apiKey) {
      return;
    }

    setGeneratingOutline(true);
    setOutline('');
    setError(null);

    const paperList = papers.map(p => ({
      title: p.title,
      authors: p.authors || '',
      year: p.year || 0,
      abstract: p.abstract || '',
    }));

    // Get review content as context
    const reviewContent = existingReviews.find(r => r.stage === 'review' || r.type === 'literature_review')?.content || '';

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/writing'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          section: 'full',
          context: reviewContent,
          topic: topic || papers[0]?.title || '',
          style: writingStyle,
          language: writingLang,
          papers: paperList,
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
      let outlineText = '';

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
              outlineText += data.content;
              setOutline(outlineText);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      setOutlineGenerated(true);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGeneratingOutline(false);
      abortRef.current = null;
    }
  };

  const handleWriteSection = async (section: Section) => {
    if (!llmSettings?.apiKey) {
      return;
    }

    setGenerating(true);
    setSectionContent('');
    setError(null);

    const paperList = papers.map(p => ({
      title: p.title,
      authors: p.authors || '',
      year: p.year || 0,
      abstract: p.abstract || '',
    }));

    const reviewContent = existingReviews.find(r => r.stage === 'review' || r.type === 'literature_review')?.content || '';

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/writing'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          section,
          outline,
          context: reviewContent,
          topic: topic || papers[0]?.title || '',
          style: writingStyle,
          language: writingLang,
          papers: paperList,
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
              setSectionContent(content);
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Store section content + add version
      setSectionContents(prev => {
        const updated = { ...prev, [section]: content };
        // Add to version history
        versions.addVersion(updated as unknown as string, { sections: Object.keys(updated) }, `${section} v${versions.versions.length + 1}`);
        return updated;
      });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleSave = async () => {
    // Save sectionContents + outline through version hook
    const contentToSave = { outline, sections: sectionContents };
    versions.updateActiveContent(contentToSave as unknown as string);

    setSaving(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'writing',
          content: JSON.stringify(contentToSave),
          stage: 'writing',
          config: JSON.stringify({ style: writingStyle, language: writingLang }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!sectionContent) return;
    try {
      await navigator.clipboard.writeText(sectionContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const displayContent = sectionContents[activeSection] ?? sectionContent ?? '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.stage.writing')}</CardTitle>
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
          <CardDescription className="text-xs">
            {t('academic.stage.writing_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Context info */}
          {topic && (
            <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
              <span className="text-xs font-medium text-muted-foreground">{t('academic.writing.topic')}:</span>
              <p className="text-sm mt-0.5">{topic}</p>
            </div>
          )}

          {/* Settings row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.literature.style')}</Label>
              <div className="flex gap-1">
                {(['apa', 'ieee', 'gb'] as const).map(s => (
                  <Button key={s} variant={writingStyle === s ? 'default' : 'outline'} size="sm" onClick={() => setWritingStyle(s)} className="flex-1 text-xs h-7">
                    {s.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.literature.language')}</Label>
              <div className="flex gap-1">
                <Button variant={writingLang === 'zh' ? 'default' : 'outline'} size="sm" onClick={() => setWritingLang('zh')} className="flex-1 text-xs h-7">涓枃</Button>
                <Button variant={writingLang === 'en' ? 'default' : 'outline'} size="sm" onClick={() => setWritingLang('en')} className="flex-1 text-xs h-7">EN</Button>
              </div>
            </div>
          </div>

          {/* Generate Outline */}
          <div className="flex gap-2">
            {generatingOutline ? (
              <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setGeneratingOutline(false); }}>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />{t('academic.literature.stop')}
              </Button>
            ) : (
              <Button onClick={handleGenerateOutline} size="sm" variant="outline">
                <List className="h-4 w-4 mr-2" />{t('academic.writing.generate_outline')}
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

      {/* Outline display */}
      {(outline || generatingOutline) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('academic.writing.outline')}</span>
              {generatingOutline && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto content-scroll">
              {outline}
              {generatingOutline && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section selector + write */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('academic.writing.write_section')}</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="flex gap-1 items-center">
                {/* Version selector */}
                {versions.versions.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 text-xs" />}>
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
                {/* Section dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="outline" size="sm" className="h-7 text-xs" />}
                  >
                    {t(SECTIONS.find(s => s.key === activeSection)?.labelKey || 'academic.writing.section.full')}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {SECTIONS.map(s => (
                      <DropdownMenuItem key={s.key} onClick={() => setActiveSection(s.key)}>
                        {t(s.labelKey)}
                        {sectionContents[s.key] && <Check className="h-3 w-3 ml-2 text-green-500" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {displayContent && !generating && (
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs px-2">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                )}
              </div>
              <div className="flex gap-1 items-center">
                {displayContent && !generating && (
                  !versions.editing && versions.hasVersions ? (
                    <Button variant="outline" size="sm" onClick={versions.startEditing} className="h-7 text-xs px-2">
                      <Pencil className="h-3 w-3 mr-1" />
                      {t('academic.common.edit') || '修改'}
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                      {t('academic.writing.save')}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            {generating ? (
              <Button variant="destructive" size="sm" onClick={() => { abortRef.current?.abort(); setGenerating(false); }}>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />{t('academic.literature.stop')}
              </Button>
            ) : (
              <Button onClick={() => handleWriteSection(activeSection)} size="sm">
                <PenLine className="h-4 w-4 mr-2" />{t('academic.writing.write_current')}
              </Button>
            )}

            {displayContent && !generating && (
              <>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs px-2">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                {!versions.editing && versions.hasVersions ? (
                  <Button variant="outline" size="sm" onClick={versions.startEditing} className="h-7 text-xs px-2">
                    <Pencil className="h-3 w-3 mr-1" />
                    {t('academic.common.edit') || '淇敼'}
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-2">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                    {t('academic.writing.save')}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Content display */}
          {(displayContent || generating) && (
            <div className="space-y-2">
              <AIEditor
                content={displayContent}
                onChange={(value) => {
                  setSectionContents(prev => ({ ...prev, [activeSection]: value }));
                  // Sync to version hook
                  const updatedSections = { ...sectionContentsRef.current, [activeSection]: value };
                  versions.updateActiveContent(updatedSections as unknown as string);
                }}
                context={`Topic: ${topic}\nOutline: ${outline}`}
                placeholder={t('academic.writing.content_placeholder')}
                readOnly={!versions.editing && versions.hasVersions}
              />
              {generating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
            </div>
          )}

          {/* Section completion badges */}
          <div className="flex flex-wrap gap-1.5">
            {SECTIONS.filter(s => s.key !== 'full').map(s => (
              <Badge
                key={s.key}
                variant={sectionContents[s.key] ? 'default' : 'outline'}
                className="text-xs cursor-pointer"
                onClick={() => setActiveSection(s.key)}
              >
                {sectionContents[s.key] ? <Check className="h-3 w-3 mr-1" /> : null}
                {t(s.labelKey)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paper references */}
      {papers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('academic.writing.references')}</span>
              <Badge variant="secondary" className="text-xs">{papers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[200px] overflow-y-auto content-scroll">
              {papers.map(p => (
                <div key={p.id} className="text-xs text-muted-foreground truncate">
                  ? {p.authors || 'Unknown'} ({p.year || 'n.d.'}). {p.title}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

