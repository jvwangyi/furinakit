'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import { LLMProvider } from '@/components/academic/LLMProvider';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  FolderPlus,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Download,
  Check,
  Key,
  FileText,
  Pencil,
  Plus,
  X,
  Import,
} from 'lucide-react';

interface Paper {
  title: string;
  authors: string[];
  year: number | null;
  citationCount: number;
  url: string;
  abstract: string | null;
  source: string;
  externalIds?: Record<string, string | null>;
}

interface VerifyResult {
  citation: string;
  valid: boolean;
  paper?: {
    title: string;
    authors: string[];
    year: number | null;
    url: string;
  };
}

type Phase = 'topic' | 'discussion' | 'search';

function AcademicLiteraturePage() {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings } = useLLM();

  // ���� Phase state ����
  const [phase, setPhase] = usePersistedState<Phase>('literature:phase', 'topic');
  const [topicInput, setTopicInput] = usePersistedState('literature:topicInput', '');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedInput, setAnalyzedInput] = usePersistedState('literature:analyzedInput', '');
  const [recommendedKeywords, setRecommendedKeywords] = usePersistedState<string[]>('literature:keywords', []);
  const [aiReasoning, setAiReasoning] = usePersistedState('literature:aiReasoning', '');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const [query, setQuery] = usePersistedState('literature:query', '');
  const [papers, setPapers] = usePersistedState<Paper[]>('literature:papers', []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [useSemanticScholar, setUseSemanticScholar] = useState(true);
  const [useArxiv, setUseArxiv] = useState(true);
  const [currentPage, setCurrentPage] = usePersistedState('literature:currentPage', 1);
  const [totalResults, setTotalResults] = usePersistedState('literature:totalResults', 0);
  const [verifying, setVerifying] = useState<Set<number>>(new Set());
  const [verifyResults, setVerifyResults] = useState<Map<number, VerifyResult>>(new Map());

  // ���� Review generation state ����
  const [selectedPapers, setSelectedPapers] = usePersistedState<Set<number>>('literature:selectedPapers', new Set());
  const [reviewStyle, setReviewStyle] = usePersistedState<'apa' | 'ieee' | 'gb'>('literature:reviewStyle', 'apa');
  const [reviewLang, setReviewLang] = usePersistedState<'zh' | 'en'>('literature:reviewLang', 'zh');
  const [generating, setGenerating] = useState(false);
  const [reviewContent, setReviewContent] = usePersistedState('literature:reviewContent', '');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ���� Add to Project state ����
  const [addToProjectOpen, setAddToProjectOpen] = useState(false);
  const [addToProjectPaper, setAddToProjectPaper] = useState<Paper | null>(null);
  const [projectList, setProjectList] = useState<Array<{ id: string; name: string }>>([]);
  const [projectListLoading, setProjectListLoading] = useState(false);
  const [addingToProject, setAddingToProject] = useState(false);
  const [addToProjectSuccess, setAddToProjectSuccess] = useState(false);
  const [addToProjectError, setAddToProjectError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // ���� Import from Project state ����
  const [importProjectOpen, setImportProjectOpen] = useState(false);
  const [importProjectList, setImportProjectList] = useState<Array<{ id: string; name: string }>>([]);
  const [importProjectLoading, setImportProjectLoading] = useState(false);
  const [importingPapers, setImportingPapers] = useState(false);
  const [importProjectError, setImportProjectError] = useState<string | null>(null);

  const handleOpenImportProject = async () => {
    setImportProjectOpen(true);
    setImportProjectError(null);
    setImportProjectLoading(true);
    try {
      const res = await fetch(apiPath('/api/academic/projects'));
      const data = await res.json();
      if (data.success) {
        setImportProjectList(data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      } else {
        setImportProjectError(data.error || 'Failed to load projects');
      }
    } catch (e) {
      setImportProjectError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setImportProjectLoading(false);
    }
  };

  const handleImportFromProject = async (projectId: string) => {
    setImportingPapers(true);
    setImportProjectError(null);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}`));
      const data = await res.json();
      if (data.success && data.data?.papers) {
        const projectPapers: Paper[] = data.data.papers.map((p: { title: string; authors: string | null; year: number | null; abstract: string | null; url: string | null }) => ({
          title: p.title,
          authors: p.authors ? p.authors.split(',').map((a: string) => a.trim()) : [],
          year: p.year,
          citationCount: 0,
          url: p.url || '',
          abstract: p.abstract,
          source: 'project',
        }));
        // Merge into existing papers, avoiding duplicates by title
        setPapers(prev => {
          const existingTitles = new Set(prev.map(p => p.title.toLowerCase()));
          const newPapers = projectPapers.filter(p => !existingTitles.has(p.title.toLowerCase()));
          return [...prev, ...newPapers];
        });

        // Check for RQ Brief in project reviews and pre-fill keywords
        const reviews: Array<{ type: string; content: string }> = data.data.reviews || [];
        const rqBrief = reviews.find((r) => r.type === 'rq_brief');
        let hasRqBrief = false;
        if (rqBrief?.content) {
          try {
            // RQ Brief content is a JSON string with fields: research_background,
            // research_question, methodology_hint, keywords (string[]), optimized_query
            const briefData = JSON.parse(rqBrief.content);
            const extractedKeywords: string[] = briefData.keywords || [];
            if (extractedKeywords.length > 0) {
              setRecommendedKeywords(extractedKeywords);
              hasRqBrief = true;
            }

            // Set topic input from project topic or research question
            const projectTopic = data.data.topic || briefData.research_question || data.data.name || '';
            if (projectTopic) {
              setTopicInput(projectTopic);
              setAnalyzedInput(projectTopic);
            }
          } catch {
            // If JSON parsing fails, try markdown extraction as fallback
            const keywordsMatch = rqBrief.content.match(/##\s*(?:关键词|Keywords?)\s*\n([\s\S]*?)(?=\n##|$)/i);
            if (keywordsMatch) {
              const extractedKeywords = keywordsMatch[1]
                .split('\n')
                .map(line => line.replace(/^[-*]\s*/, '').trim())
                .filter(line => line.length > 0);
              if (extractedKeywords.length > 0) {
                setRecommendedKeywords(extractedKeywords);
                hasRqBrief = true;
              }
            }
            const projectTopic = data.data.topic || data.data.name || '';
            if (projectTopic) {
              setTopicInput(projectTopic);
              setAnalyzedInput(projectTopic);
            }
          }
        }

        setImportProjectOpen(false);
        // If we have RQ Brief keywords, go to discussion phase so user can review them;
        // otherwise go straight to search phase as before
        if (hasRqBrief) {
          setPhase('discussion');
        } else if (phase !== 'search') {
          setPhase('search');
        }
      } else {
        setImportProjectError(data.error || 'Failed to load project papers');
      }
    } catch (e) {
      setImportProjectError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setImportingPapers(false);
    }
  };

  // Load project list on mount
  useEffect(() => {
    fetch(apiPath('/api/academic/projects'))
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list = data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
          setProjectList(list);
        }
      })
      .catch(() => {});
  }, []);

  const LIMIT = 20;

  // ���� LLM analysis via /api/academic/socratic ����
  const doAnalyze = useCallback(async (input: string) => {
    if (!input.trim() || input.trim().length < 3) {
      setRecommendedKeywords([]);
      setAnalyzedInput('');
      setAiReasoning('');
      return;
    }

    setAnalyzing(true);
    setAnalyzedInput(input);
    setRecommendedKeywords([]);
    setAiReasoning('');

    try {
      if (!llmSettings?.apiKey || !llmSettings?.provider) {
        setAnalyzing(false);
        return;
      }

      const res = await fetch(apiPath('/api/academic/socratic'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: input,
          messages: [{ role: 'user', content: input }],
          llm: llmSettings,
          mode: 'analyze',
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
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
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'keywords' && Array.isArray(data.data)) {
              setRecommendedKeywords(data.data);
              if (data.reasoning) {
                setAiReasoning(data.reasoning);
              }
            }
          } catch { /* skip malformed */ }
        }
      }

      setPhase('discussion');
    } catch (e) {
      console.error('LLM analysis failed:', e);
    } finally {
      setAnalyzing(false);
    }
  }, [llmSettings]);

  const handleAnalyze = useCallback(() => {
    if (topicInput.trim().length >= 3) {
      doAnalyze(topicInput);
    }
  }, [topicInput, doAnalyze]);

  // ���� Keyword editing ����
  const startEditKeyword = (index: number) => {
    setEditingIndex(index);
    setEditValue(recommendedKeywords[index]);
  };

  const saveEditKeyword = () => {
    if (editingIndex !== null && editValue.trim()) {
      setRecommendedKeywords(prev => {
        const next = [...prev];
        next[editingIndex] = editValue.trim();
        return next;
      });
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const removeKeyword = (index: number) => {
    setRecommendedKeywords(prev => prev.filter((_, i) => i !== index));
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setRecommendedKeywords(prev => [...prev, newKeyword.trim()]);
      setNewKeyword('');
      setShowAddKeyword(false);
    }
  };

  // Search with recommended keywords
  const searchWithKeywords = useCallback(() => {
    if (recommendedKeywords.length === 0) return;
    const combinedQuery = recommendedKeywords.join(' ');
    setQuery(combinedQuery);
    setPhase('search');
    handleSearchDirect(combinedQuery);
  }, [recommendedKeywords]); // eslint-disable-line react-hooks/exhaustive-deps

  // Go back to discussion phase
  const handleBackToDiscussion = () => {
    setPhase('discussion');
  };

  // Re-discuss
  const handleRediscuss = () => {
    setPhase('topic');
    setRecommendedKeywords([]);
    setAiReasoning('');
    setAnalyzedInput('');
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleSearchDirect = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) return;

    const offset = (page - 1) * LIMIT;
    setLoading(true);
    setError(null);
    setPapers([]);
    setExpanded(new Set());
    setVerifyResults(new Map());
    setSelectedPapers(new Set());
    setCurrentPage(page);

    try {
      const sources: string[] = [];
      if (useSemanticScholar) sources.push('semantic-scholar');
      if (useArxiv) sources.push('arxiv');

      if (sources.length === 0) {
        setError('Please select at least one source');
        setLoading(false);
        return;
      }

      const res = await fetch(apiPath('/api/academic/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          sources,
          limit: LIMIT,
          offset,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!data) {
        setError(t('academic.common.search_failed'));
        return;
      }

      if (!data.success) {
        setError(data.error || 'Search failed');
        return;
      }

      const newPapers = data.data || [];
      setPapers(newPapers);
      setTotalResults(data.total || 0);
      setApiErrors(data.errors || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [useSemanticScholar, useArxiv]);

  const handleSearch = useCallback(async (page: number = 1) => {
    handleSearchDirect(query, page);
  }, [query, handleSearchDirect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (phase === 'search') {
        handleSearch(1);
      }
    }
  };

  const toggleExpand = (index: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const togglePaperSelect = (index: number) => {
    setSelectedPapers(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPapers.size === papers.length) {
      setSelectedPapers(new Set());
    } else {
      setSelectedPapers(new Set(papers.map((_, i) => i)));
    }
  };

  const handleVerify = async (index: number) => {
    const paper = papers[index];
    if (!paper) return;

    setVerifying(prev => new Set(prev).add(index));

    try {
      const res = await fetch(apiPath('/api/academic/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citations: [paper.title] }),
      });

      const data = await res.json();

      if (data.success && data.results && data.results.length > 0) {
        setVerifyResults(prev => new Map(prev).set(index, data.results[0]));
      }
    } catch {
      // Silently fail
    } finally {
      setVerifying(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  // ���� Review generation ����
  const handleGenerateReview = async () => {
    if (!llmSettings?.apiKey) {
      openSettings();
      return;
    }

    setGenerating(true);
    setReviewContent('');
    setReviewError(null);

    const selectedIndices = selectedPapers.size > 0
      ? Array.from(selectedPapers)
      : papers.map((_, i) => i);

    const paperList = selectedIndices.map(i => papers[i]).filter(Boolean).map(p => ({
      title: p.title,
      authors: p.authors.join(', '),
      year: p.year || 0,
      abstract: p.abstract || '',
    }));

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch(apiPath('/api/academic/review'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: query,
          papers: paperList,
          style: reviewStyle,
          language: reviewLang,
          llm: llmSettings,
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
              setReviewContent(prev => prev + data.content);
            } else if (data.type === 'done') {
              // Stream completed successfully — citations available in data.citations
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
      setReviewError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  // ���� Add to Project ����
  const handleOpenAddToProject = async (paper: Paper) => {
    setAddToProjectPaper(paper);
    setAddToProjectOpen(true);
    setAddToProjectSuccess(false);
    setAddToProjectError(null);
    setProjectListLoading(true);
    try {
      const res = await fetch(apiPath('/api/academic/projects'));
      const data = await res.json();
      if (data.success) {
        setProjectList(data.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
      } else {
        setAddToProjectError(data.error || 'Failed to load projects');
      }
    } catch (e) {
      setAddToProjectError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setProjectListLoading(false);
    }
  };

  const handleAddToProject = async (projectId: string) => {
    if (!addToProjectPaper) return;
    setAddingToProject(true);
    setAddToProjectError(null);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/papers`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: addToProjectPaper.title,
          authors: addToProjectPaper.authors.join(', '),
          year: addToProjectPaper.year,
          abstract: addToProjectPaper.abstract,
          url: addToProjectPaper.url,
          doi: addToProjectPaper.externalIds?.DOI || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddToProjectSuccess(true);
        setTimeout(() => setAddToProjectOpen(false), 1200);
      } else {
        setAddToProjectError(data.error || 'Failed to add paper');
      }
    } catch (e) {
      setAddToProjectError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setAddingToProject(false);
    }
  };

  const handleCopy = async () => {
    if (!reviewContent) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reviewContent);
      } else {
        const ta = document.createElement('textarea');
        ta.value = reviewContent;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleExportMarkdown = () => {
    if (!reviewContent) return;
    const blob = new Blob([reviewContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-${query.replace(/\s+/g, '-').substring(0, 40)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportGeneric = async (content: string, format: 'markdown' | 'docx' | 'latex', filename?: string) => {
    try {
      const res = await fetch(apiPath('/api/academic/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format, filename }),
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
      a.download = `${filename || 'export'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Export failed');
    }
  };

  const handleStopGeneration = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{t('academic.literature.title')}</h1>
              <p className="text-muted-foreground text-sm">{t('academic.literature.description')}</p>
            </div>
          </div>
          <ApiKeySelector />
        </div>

        
        {phase === 'topic' && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{t('academic.literature.smart_search')}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t('academic.literature.two_phase_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!llmSettings?.apiKey ? (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {t('academic.apikey_required_title')}
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
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      placeholder={t('academic.literature.topic_placeholder')}
                      value={topicInput}
                      onChange={(e) => {
                        setTopicInput(e.target.value);
                        // auto-resize
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={handleTopicKeyDown}
                      className="pl-10 min-h-[40px] max-h-[200px] resize-none overflow-y-auto content-scroll"
                      disabled={analyzing}
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing || topicInput.trim().length < 3}
                    size="sm"
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {t('academic.literature.analyze_keywords')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        
        {phase === 'discussion' && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{t('academic.literature.keyword_discussion')}</CardTitle>
              </div>
              <CardDescription className="text-xs">
                {t('academic.literature.discussion_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiReasoning && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{t('academic.literature.ai_reasoning')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{aiReasoning}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{t('academic.literature.analyzed_topic')}:</span>{' '}
                <span className="text-foreground">{analyzedInput}</span>
              </div>

              {recommendedKeywords.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">
                      {t('academic.literature.recommended_keywords')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {recommendedKeywords.map((kw, i) => (
                      <div key={i} className="group relative">
                        {editingIndex === i ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEditKeyword}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditKeyword();
                              if (e.key === 'Escape') { setEditingIndex(null); setEditValue(''); }
                            }}
                            className="h-7 w-36 text-xs px-2"
                            autoFocus
                          />
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-primary/10 transition-colors pr-1 py-1"
                          >
                            <span onClick={() => startEditKeyword(i)}>{kw}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeKeyword(i); }}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}
                      </div>
                    ))}

                    {showAddKeyword ? (
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onBlur={() => { if (newKeyword.trim()) addKeyword(); else setShowAddKeyword(false); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addKeyword();
                          if (e.key === 'Escape') { setShowAddKeyword(false); setNewKeyword(''); }
                        }}
                        placeholder={t('academic.literature.add_keyword')}
                        className="h-7 w-32 text-xs px-2"
                        autoFocus
                      />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddKeyword(true)}
                        className="h-7 px-2 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-0.5" />
                        {t('academic.literature.add')}
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={searchWithKeywords}
                      disabled={loading || recommendedKeywords.length === 0}
                      className="h-8 text-xs"
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
                      {t('academic.literature.start_search')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRediscuss}
                      className="h-8 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      {t('academic.literature.rediscuss')}
                    </Button>
                  </div>
                </div>
              )}

              {analyzing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('academic.literature.analyzing_topic')}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        
        {phase === 'search' && (
          <div className="space-y-4 mb-6">
            {/* Project Selector */}
            {projectList.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">{t('academic.projects.title')}:</Label>
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value || null)}
                  className="flex-1 h-8 rounded-lg border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                >
                  <option value="">{t('academic.projects.title')}</option>
                  {projectList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProjectId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => window.open(`/academic/projects/${selectedProjectId}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {t('academic.projects.back')}
                  </Button>
                )}
              </div>
            )}

            {/* Current Keywords Bar */}
            {recommendedKeywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  {t('academic.literature.current_keywords')}:
                </span>
                {recommendedKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDiscussion}
                  className="h-6 px-2 text-xs ml-auto"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  {t('academic.literature.modify_keywords')}
                </Button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                placeholder={t('academic.literature.title') + '...'}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 min-h-[40px] max-h-[200px] resize-none overflow-y-auto content-scroll bg-card border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-colors"
                disabled={loading}
                rows={1}
              />
            </div>

            {/* Source checkboxes + Search button */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useSemanticScholar}
                  onChange={(e) => setUseSemanticScholar(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                Semantic Scholar
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useArxiv}
                  onChange={(e) => setUseArxiv(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                arXiv
              </label>
              <Button
                onClick={() => handleSearch(1)}
                disabled={loading || !query.trim()}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('academic.literature.searching') }
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    {t('academic.literature.start_search')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenImportProject}
                className="text-xs"
              >
                <Import className="h-4 w-4 mr-1.5" />
                {t('academic.common.import_from_project')}
              </Button>
            </div>
          </div>
        )}

        {/* API Errors */}
        {apiErrors && apiErrors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">{t('academic.common.partial_results')}</span>
            </div>
            {apiErrors.map((err, i) => (
              <p key={i} className="text-xs mt-1">{err}</p>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {/* Results */}
        {papers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {papers.length} {t('tools.count')}
              </p>
              <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="h-7 text-xs">
                {selectedPapers.size === papers.length ? t('academic.common.deselect_all') : t('academic.common.select_all')}
              </Button>
            </div>

            {papers.map((paper, index) => {
              const isExpanded = expanded.has(index);
              const verifyResult = verifyResults.get(index);
              const isVerifying = verifying.has(index);
              const isSelected = selectedPapers.has(index);

              return (
                <Card
                  key={index}
                  className={`transition-all duration-200 hover:border-primary/20 ${
                    isSelected ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePaperSelect(index)}
                        className="mt-1 h-4 w-4 rounded border-border accent-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-snug">
                          {paper.url ? (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                              {paper.title}
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                            </a>
                          ) : (
                            paper.title
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {paper.authors.length > 0 && (
                            <span>{paper.authors.slice(0, 5).join(', ')}{paper.authors.length > 5 ? ` +${paper.authors.length - 5}` : ''}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {paper.source}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {paper.year && (
                        <Badge variant="secondary" className="text-xs">
                          {paper.year}
                        </Badge>
                      )}
                      {paper.citationCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {paper.citationCount} citations
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {paper.abstract && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(index)}
                          className="h-7 text-xs px-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Hide Abstract
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              Show Abstract
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerify(index)}
                        disabled={isVerifying}
                        className="h-7 text-xs px-2"
                      >
                        {isVerifying ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <ShieldCheck className="h-3 w-3 mr-1" />
                        )}
                        Verify Citation
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedProjectId) {
                            setAddToProjectPaper(paper);
                            handleAddToProject(selectedProjectId);
                          } else {
                            handleOpenAddToProject(paper);
                          }
                        }}
                        disabled={!selectedProjectId}
                        className="h-7 text-xs px-2"
                      >
                        <FolderPlus className="h-3 w-3 mr-1" />
                        {t('academic.literature.add_to_project')}
                      </Button>
                    </div>

                    {verifyResult && (
                      <div className={`mb-3 p-2 rounded-md text-xs ${
                        verifyResult.valid
                          ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400'
                          : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {verifyResult.valid ? (
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            <span>{t('academic.common.verified')}</span>
                            {verifyResult.paper?.url && (
                              <a href={verifyResult.paper.url} target="_blank" rel="noopener noreferrer" className="underline ml-1">
                                View
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>Not found in Semantic Scholar</span>
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && paper.abstract && (
                      <div className="p-3 rounded-md bg-muted/50 text-sm text-muted-foreground leading-relaxed">
                        {paper.abstract}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalResults > LIMIT && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <p className="text-xs text-muted-foreground">
                  {t('academic.literature.page_info')
                    .replace('{current}', String(currentPage))
                    .replace('{total}', String(Math.ceil(totalResults / LIMIT)))
                    }
                  {' '}{totalResults} {t('academic.literature.results_unit') }
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(1)}
                    disabled={currentPage === 1 || loading}
                    className="h-8 px-2 text-xs"
                  >
                    ?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="h-8 px-2 text-xs"
                  >
                    ?
                  </Button>
                  {Array.from({ length: Math.min(5, Math.ceil(totalResults / LIMIT)) }, (_, i) => {
                    const totalPages = Math.ceil(totalResults / LIMIT);
                    let start = Math.max(1, currentPage - 2);
                    let end = Math.min(totalPages, start + 4);
                    if (end - start < 4) start = Math.max(1, end - 4);
                    const page = start + i;
                    if (page > end) return null;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSearch(page)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-xs"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalResults / LIMIT) || loading}
                    className="h-8 px-2 text-xs"
                  >
                    ?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(Math.ceil(totalResults / LIMIT))}
                    disabled={currentPage >= Math.ceil(totalResults / LIMIT) || loading}
                    className="h-8 px-2 text-xs"
                  >
                    ?
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        
        {papers.length > 0 && phase === 'search' && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>{t('academic.literature.generate_review') || 'Generate Literature Review'}</CardTitle>
              </div>
              <CardDescription>
                {t('academic.literature.generate_review_desc') || 'Select papers and generate an AI-powered literature review.'}
                {selectedPapers.size > 0
                  ? ` (${selectedPapers.size} papers selected)`
                  : ` (All ${papers.length} papers will be used)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Settings row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Style */}
                <div className="space-y-2">
                  <Label className="text-xs">{t('academic.literature.style') || 'Citation Style'}</Label>
                  <div className="flex gap-1">
                    {(['apa', 'ieee', 'gb'] as const).map((s) => (
                      <Button
                        key={s}
                        variant={reviewStyle === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReviewStyle(s)}
                        className="flex-1 text-xs"
                      >
                        {s.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-xs">{t('academic.literature.language') || 'Language'}</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={reviewLang === 'zh' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReviewLang('zh')}
                      className="flex-1 text-xs"
                    >
                      ����
                    </Button>
                    <Button
                      variant={reviewLang === 'en' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReviewLang('en')}
                      className="flex-1 text-xs"
                    >{t('academic.common.english')}</Button>
                  </div>
                </div>

                {/* LLM Config */}
                <div className="space-y-2">
                  <Label className="text-xs">{t('academic.llm.settings') || 'LLM Settings'}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openSettings}
                    className="w-full text-xs justify-start"
                  >
                    <Key className="h-3 w-3 mr-2" />
                    {llmSettings?.apiKey
                      ? `${llmSettings.provider} (${llmSettings.model || 'default'})`
                      : (t('academic.llm.configure') || 'Configure API Key')}
                  </Button>
                </div>
              </div>

              {/* Generate button */}
              <div className="flex gap-2">
                {generating ? (
                  <Button variant="destructive" onClick={handleStopGeneration}>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('academic.literature.stop') || 'Stop Generation'}
                  </Button>
                ) : (
                  <Button onClick={handleGenerateReview} disabled={papers.length === 0}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('academic.literature.generate') || 'Generate Review'}
                  </Button>
                )}
              </div>

              {/* Review error */}
              {reviewError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {reviewError}
                  </div>
                </div>
              )}

              {/* Review output */}
              {(reviewContent || generating) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {t('academic.literature.review_output') || 'Generated Review'}
                      </span>
                      {generating && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      )}
                    </div>
                    {reviewContent && !generating && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
                          {copied ? (
                            <><Check className="h-3 w-3 mr-1" /> {t('academic.common.copied')}</>
                          ) : (
                            <><Copy className="h-3 w-3 mr-1" /> {t('academic.common.copy')}</>
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="sm" className="h-7 text-xs" />
                            }
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExportGeneric(reviewContent, 'markdown', `review-${query.replace(/\s+/g, '-').substring(0, 40)}`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportGeneric(reviewContent, 'docx', `review-${query.replace(/\s+/g, '-').substring(0, 40)}`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              DOCX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportGeneric(reviewContent, 'latex', `review-${query.replace(/\s+/g, '-').substring(0, 40)}`)}>
                              <FileText className="h-4 w-4 mr-2" />
                              LaTeX
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <div
                    ref={reviewRef}
                    className="p-4 rounded-lg bg-muted/50 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto main-scroll prose prose-sm dark:prose-invert max-w-none"
                  >
                    {reviewContent}
                    {generating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && papers.length === 0 && query && !error && phase === 'search' && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-1">{t('tools.empty')}</p>
            <p className="text-sm">{t('tools.empty.desc')}</p>
          </div>
        )}

        {!loading && papers.length === 0 && !query && phase === 'search' && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-1">{t('academic.literature.title')}</p>
            <p className="text-sm">{t('academic.literature.description')}</p>
          </div>
        )}
      </div>

      {/* Add to Project Dialog */}
      <Dialog open={addToProjectOpen} onOpenChange={setAddToProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('academic.literature.add_to_project')}</DialogTitle>
            <DialogDescription>
              {addToProjectPaper?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {addToProjectError && (
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {addToProjectError}
              </div>
            )}
            {addToProjectSuccess && (
              <div className="p-2 rounded-md bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs">
                <Check className="h-3 w-3 inline mr-1" />
                {t('academic.literature.added_to_project')}
              </div>
            )}
            {projectListLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : projectList.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>{t('academic.literature.no_projects')}</p>
                <p className="text-xs mt-1">{t('academic.literature.no_projects_desc')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projectList.map((proj) => (
                  <Button
                    key={proj.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddToProject(proj.id)}
                    disabled={addingToProject || addToProjectSuccess}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    {proj.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToProjectOpen(false)}>
              {t('btn.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from Project Dialog */}
      <Dialog open={importProjectOpen} onOpenChange={setImportProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('academic.common.import_from_project')}</DialogTitle>
            <DialogDescription>{t('academic.common.select_project')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {importProjectError && (
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {importProjectError}
              </div>
            )}
            {importProjectLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : importProjectList.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <p>{t('academic.literature.no_projects') }</p>
                <p className="text-xs mt-1">{t('academic.literature.no_projects_desc') }</p>
              </div>
            ) : (
              <div className="space-y-2">
                {importProjectList.map((proj) => (
                  <Button
                    key={proj.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleImportFromProject(proj.id)}
                    disabled={importingPapers}
                  >
                    <Import className="h-4 w-4 mr-2" />
                    {proj.name}
                    {importingPapers && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportProjectOpen(false)}>
              {t('btn.cancel') }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AcademicLiteraturePageWrapper() {
  return (
    <LLMProvider>
      <AcademicLiteraturePage />
    </LLMProvider>
  );
}
