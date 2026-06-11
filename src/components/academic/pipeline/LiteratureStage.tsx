'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderPlus,
  Loader2,
  AlertCircle,
  Check,
  BookOpen,
  Sparkles,
  Network,
  X,
  FileSearch,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Clock,
  Key,
  FolderKanban,
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
  venue?: string | null;
  paperId?: string | null;
}

interface SearchHistoryItem {
  query: string;
  date: string;
  resultCount: number;
}

interface RelatedPapers {
  citations: Paper[];
  references: Paper[];
}

interface LiteratureStageProps {
  projectId: string;
  existingPapers: Array<{ title: string; id: string; doi?: string | null }>;
  onPaperAdded: () => void;
  savedData?: Record<string, unknown> | null;
  initialKeywords?: string[];
  initialQuery?: string;
  onCompleted?: () => void;
}

type YearFilter = 'all' | '1' | '3' | '5' | '10' | 'custom';
type CitationFilter = 'all' | '10' | '50' | '100' | '500';
type SortBy = 'relevance' | 'citations_desc' | 'year_desc' | 'year_asc';

export function LiteratureStage({ projectId, existingPapers, onPaperAdded, savedData, initialKeywords, initialQuery, onCompleted }: LiteratureStageProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [useSemanticScholar, setUseSemanticScholar] = useState(true);
  const [useArxiv, setUseArxiv] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [batchAdding, setBatchAdding] = useState(false);
  const [expandedQueries, setExpandedQueries] = useState<string[]>([]);
  const [ssUnavailable, setSsUnavailable] = useState(false);

  // ─── API Key from unified context ──────────────────────────────────────
  const { settings: llmSettings, getLLMConfig } = useLLM();

  // ─── Two-phase flow state ─────────────────────────────────────────────
  type Phase = 'topic' | 'discussion' | 'search';
  const [phase, setPhase] = useState<Phase>('topic');
  const [topicInput, setTopicInput] = useState('');

  // ─── LLM analysis state ───────────────────────────────────────────────
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzedInput, setAnalyzedInput] = useState('');
  const [recommendedKeywords, setRecommendedKeywords] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Filter state ──────────────────────────────────────────────────────
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [customYearStart, setCustomYearStart] = useState('');
  const [customYearEnd, setCustomYearEnd] = useState('');
  const [citationFilter, setCitationFilter] = useState<CitationFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');

  // ─── Pagination state ──────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // ─── Search history ──────────────────────────────────────────────────
  const [manageOpen, setManageOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const SEARCH_HISTORY_KEY = 'furinakit-search-history';
  const MAX_HISTORY = 20;
  const DISPLAY_HISTORY = 3;

  // ─── Verify state ──────────────────────────────────────────────────────
  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<number, { status: string; message: string }>>({});

  // ─── Related papers state ───────────────────────────────────────────────────
  const [relatedPaperIndex, setRelatedPaperIndex] = useState<number | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedPapers | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const handleRemovePaper = async (paper: { id: string; doi?: string | null }) => {
    try {
      const body: Record<string, string> = {};
      if (paper.doi) {
        body.doi = paper.doi;
      } else {
        body.paperId = paper.id;
      }
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/papers`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        // Clear addedIndices so search results re-sync with updated existingPapers
        setAddedIndices(new Set());
        onPaperAdded(); // refresh
      } else {
        console.error('Failed to remove paper:', data.error);
      }
    } catch (e) {
      console.error('Failed to remove paper:', e);
    }
  };

  const LIMIT = 20;

  // Debounce ref for search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const existingTitles = new Set(existingPapers.map(p => p.title.toLowerCase()));

  // ─── Initialize from previous stage data ─────────────────────────────
  useEffect(() => {
    if (initialKeywords && initialKeywords.length > 0) {
      setRecommendedKeywords(initialKeywords);
      setPhase('discussion'); // Jump to keyword discussion phase
    }
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) setSearchHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Save search to history
  const saveSearchHistory = useCallback((q: string, count: number) => {
    if (!q.trim()) return;
    setSearchHistory(prev => {
      const item: SearchHistoryItem = {
        query: q.trim(),
        date: new Date().toISOString(),
        resultCount: count,
      };
      const filtered = prev.filter(h => h.query.toLowerCase() !== q.trim().toLowerCase());
      const next = [item, ...filtered].slice(0, MAX_HISTORY);
      try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const removeHistoryItem = useCallback((index: number) => {
    setSearchHistory(prev => {
      const next = prev.filter((_, i) => i !== index);
      try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Deduplicate papers by title similarity
  const deduplicatePapers = useCallback((paperList: Paper[]): Paper[] => {
    const result: Paper[] = [];
    for (const paper of paperList) {
      const titleLower = paper.title.toLowerCase().trim();
      const isDuplicate = result.some(existing => {
        const existingLower = existing.title.toLowerCase().trim();
        if (titleLower === existingLower) return true;
        const shorter = titleLower.length < existingLower.length ? titleLower : existingLower;
        const longer = titleLower.length < existingLower.length ? existingLower : titleLower;
        if (longer.includes(shorter)) return true;
        const words1 = new Set(titleLower.split(/\s+/));
        const words2 = new Set(existingLower.split(/\s+/));
        const intersection = [...words1].filter(w => words2.has(w)).length;
        const union = new Set([...words1, ...words2]).size;
        return union > 0 && intersection / union > 0.7;
      });
      if (!isDuplicate) result.push(paper);
    }
    return result;
  }, []);

  // Highlight search keywords in text
  const highlightText = useCallback((text: string, keywords: string[]): React.ReactNode => {
    if (!keywords.length || !text) return text;
    const escaped = keywords
      .filter(k => k.trim().length > 1)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!escaped.length) return text;
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => {
      if (keywords.some(k => part.toLowerCase() === k.toLowerCase())) {
        return <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 rounded px-0.5">{part}</mark>;
      }
      return part;
    });
  }, []);

  // Get current search keywords for highlighting
  const currentKeywords = useMemo(() => {
    if (recommendedKeywords.length > 0) return recommendedKeywords;
    if (query.trim()) return query.trim().split(/\s+/).filter(w => w.length > 1);
    return [];
  }, [recommendedKeywords, query]);

  // ─── Filtered & sorted papers ──────────────────────────────────────────────

  const filteredPapers = useMemo(() => {
    let result = [...papers];
    const currentYear = new Date().getFullYear();

    if (yearFilter !== 'all') {
      if (yearFilter === 'custom') {
        const start = customYearStart ? parseInt(customYearStart, 10) : 0;
        const end = customYearEnd ? parseInt(customYearEnd, 10) : 9999;
        result = result.filter(p => p.year !== null && p.year >= start && p.year <= end);
      } else {
        const years = parseInt(yearFilter, 10);
        result = result.filter(p => p.year !== null && p.year >= currentYear - years);
      }
    }

    if (citationFilter !== 'all') {
      const minCitations = parseInt(citationFilter, 10);
      result = result.filter(p => p.citationCount >= minCitations);
    }

    switch (sortBy) {
      case 'citations_desc':
        result.sort((a, b) => b.citationCount - a.citationCount);
        break;
      case 'year_desc':
        result.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case 'year_asc':
        result.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
        break;
    }

    return result;
  }, [papers, yearFilter, customYearStart, customYearEnd, citationFilter, sortBy]);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of papers) {
      counts[p.source] = (counts[p.source] || 0) + 1;
    }
    return counts;
  }, [papers]);

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / PAGE_SIZE));
  const paginatedPapers = filteredPapers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, customYearStart, customYearEnd, citationFilter, sortBy]);

  // ─── LLM analysis via /api/academic/socratic (analyze mode) ───────────

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
          llm: getLLMConfig(),
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

      // Transition to discussion phase
      setPhase('discussion');
    } catch (e) {
      // Silent fail — user can still type keywords manually
      console.error('LLM analysis failed:', e);
    } finally {
      setAnalyzing(false);
    }
  }, [llmSettings]);

  // Manual analyze button handler
  const handleAnalyze = useCallback(() => {
    if (topicInput.trim().length >= 3) {
      doAnalyze(topicInput);
    }
  }, [topicInput, doAnalyze]);

  // ─── Keyword editing ──────────────────────────────────────────────────

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

  // ─── Search ─────────────────────────────────────────────────────────────

  const doSearch = useCallback(async (targetOffset = 0, currentQuery: string) => {
    if (!currentQuery.trim()) return;
    setLoading(true);
    setError(null);
    if (targetOffset === 0) {
      setPapers([]);
      setExpanded(new Set());
      setCurrentOffset(0);
      setAddedIndices(new Set());
      setSelectedIndices(new Set());
      setExpandedQueries([]);
      setSsUnavailable(false);
      setCurrentPage(1);
    }

    try {
      const sources: string[] = [];
      if (useSemanticScholar) sources.push('semantic-scholar');
      if (useArxiv) sources.push('arxiv');
      if (sources.length === 0) {
        setError(t('academic.literature.select_source') || 'Please select at least one source');
        setLoading(false);
        return;
      }

      const res = await fetch(apiPath('/api/academic/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: currentQuery.trim(),
          sources,
          limit: LIMIT,
          offset: targetOffset,
          llm: getLLMConfig(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Search failed');
        return;
      }
      const newPapers = deduplicatePapers(data.data || []);
      setPapers(prev => targetOffset > 0 ? deduplicatePapers([...prev, ...newPapers]) : newPapers);
      if (targetOffset === 0) saveSearchHistory(currentQuery, newPapers.length);
      setHasMore(newPapers.length >= LIMIT);
      setCurrentOffset(targetOffset + newPapers.length);
      if (targetOffset === 0 && data.expandedQueries?.length > 0) {
        setExpandedQueries(data.expandedQueries);
      }
      if (data.semanticScholarUnavailable) {
        setSsUnavailable(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [useSemanticScholar, useArxiv, t]);

  // Search with recommended keywords — transition to search phase
  const searchWithKeywords = useCallback(() => {
    if (recommendedKeywords.length === 0) return;
    const combinedQuery = recommendedKeywords.join(' ');
    setQuery(combinedQuery);
    setAnalyzedInput('');
    setPhase('search');
    doSearch(0, combinedQuery);
  }, [recommendedKeywords, doSearch]);

  // Direct search (Enter key or search button)
  const handleSearch = useCallback((targetOffset = 0) => {
    if (targetOffset > 0) {
      doSearch(targetOffset, query);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPhase('search');
      doSearch(0, query);
    }, 500);
  }, [query, doSearch]);

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch(0);
    }
  };

  // Go back to discussion phase to modify keywords
  const handleBackToDiscussion = () => {
    setPhase('discussion');
  };

  // Re-discuss: go back to topic phase
  const handleRediscuss = () => {
    setPhase('topic');
    setRecommendedKeywords([]);
    setAiReasoning('');
    setAnalyzedInput('');
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    // Select/deselect only papers on the current page
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageEnd = Math.min(pageStart + PAGE_SIZE, filteredPapers.length);
    const pageIndices = Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i);
    
    const allPageSelected = pageIndices.every(i => selectedIndices.has(i));
    
    if (allPageSelected) {
      // Deselect all on current page
      setSelectedIndices(prev => {
        const next = new Set(prev);
        pageIndices.forEach(i => next.delete(i));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedIndices(prev => {
        const next = new Set(prev);
        pageIndices.forEach(i => next.add(i));
        return next;
      });
    }
  };

  const handleBatchAdd = async () => {
    const indices = Array.from(selectedIndices);
    if (indices.length === 0) return;
    setBatchAdding(true);
    for (const index of indices) {
      const paper = filteredPapers[(currentPage - 1) * PAGE_SIZE + index];
      if (!paper || addedIndices.has(index) || existingTitles.has(paper.title.toLowerCase())) continue;
      try {
        const res = await fetch(apiPath(`/api/academic/projects/${projectId}/papers`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: paper.title,
            authors: paper.authors.join(', '),
            year: paper.year,
            abstract: paper.abstract,
            url: paper.url,
            doi: paper.externalIds?.DOI || undefined,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAddedIndices(prev => new Set(prev).add(index));
        }
      } catch { /* skip */ }
    }
    onPaperAdded();
    setSelectedIndices(new Set());
    setBatchAdding(false);
  };

  const toggleExpand = (index: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAddToProject = async (paper: Paper, index: number) => {
    setAddingIndex(index);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/papers`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          authors: paper.authors.join(', '),
          year: paper.year,
          abstract: paper.abstract,
          url: paper.url,
          doi: paper.externalIds?.DOI || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddedIndices(prev => new Set(prev).add(index));
        onPaperAdded();
      } else {
        setError(data.error || 'Failed to add paper');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setAddingIndex(null);
    }
  };

  // ─── Citation verify ────────────────────────────────────────────────────────

  const handleVerify = async (paper: Paper, index: number) => {
    setVerifyingIndex(index);
    try {
      const res = await fetch(apiPath('/api/academic/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citations: [paper.title] }),
      });
      const data = await res.json();
      if (data.success && data.results?.length > 0) {
        const r = data.results[0];
        setVerifyResults(prev => ({
          ...prev,
          [index]: { status: r.valid ? 'ok' : 'error', message: r.valid ? (t('academic.literature.verify_ok') || '引用验证通过') : (t('academic.literature.verify_fail') || '未在 Semantic Scholar 中找到') },
        }));
      } else {
        setVerifyResults(prev => ({
          ...prev,
          [index]: { status: 'error', message: data.error || t('academic.literature.verify_fail') },
        }));
      }
    } catch (e) {
      setVerifyResults(prev => ({
        ...prev,
        [index]: { status: 'error', message: e instanceof Error ? e.message : 'Network error' },
      }));
    } finally {
      setVerifyingIndex(null);
    }
  };

  // ─── Related papers ─────────────────────────────────────────────────────────

  const fetchRelatedPapers = async (paper: Paper, index: number) => {
    if (!paper.paperId) return;

    if (relatedPaperIndex === index) {
      setRelatedPaperIndex(null);
      setRelatedData(null);
      return;
    }

    setRelatedPaperIndex(index);
    setRelatedLoading(true);
    setRelatedError(null);
    setRelatedData(null);

    try {
      const res = await fetch(apiPath('/api/academic/related'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.paperId }),
      });
      const data = await res.json();
      if (data.success) {
        setRelatedData(data.data);
      } else {
        setRelatedError(data.error || 'Failed to fetch related papers');
      }
    } catch (e) {
      setRelatedError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setRelatedLoading(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const currentYear = new Date().getFullYear();
  const isHighImpact = (p: Paper) => p.citationCount > 100;
  const isRecent = (p: Paper) => p.year !== null && p.year >= currentYear - 3;

  return (
    <div className="space-y-4">
      {/* ─── Phase: Topic Input ────────────────────────────────────────── */}
      {phase === 'topic' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{t('academic.literature.title')}</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {t('academic.literature.two_phase_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* ─── No API Key: show config prompt ─────────────────────────── */}
            {!llmSettings?.apiKey ? (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      {t('academic.literature.apikey_required_title')}
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
                {/* ─── Topic Input ──────────────────────────────────────── */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder={t('academic.literature.topic_placeholder')}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={handleTopicKeyDown}
                    className="pl-10"
                    disabled={analyzing}
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

                {/* ─── Search History ──────────────────────────────────────── */}
                {searchHistory.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t('academic.literature.recent_searches')}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {searchHistory.slice(0, DISPLAY_HISTORY).map((item, i) => (
                        <div key={i} className="group flex items-center gap-2 text-xs">
                          <button
                            onClick={() => {
                              setQuery(item.query);
                              setPhase('search');
                              doSearch(0, item.query);
                            }}
                            className="flex-1 text-left hover:text-primary transition-colors truncate"
                          >
                            {item.query}
                            <span className="text-muted-foreground ml-1">
                              ({item.resultCount} {t('academic.literature.results_unit')})
                            </span>
                          </button>
                          <button
                            onClick={() => removeHistoryItem(i)}
                            className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Search Suggestions (when no history) ────────────────── */}
                {searchHistory.length === 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">
                      {t('academic.literature.search_suggestions')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['tree skeleton extraction', 'plant structure reconstruction', 'point cloud processing'].map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => {
                            setTopicInput(s);
                            doAnalyze(s);
                          }}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Phase: Keyword Discussion ──────────────────────────────────── */}
      {phase === 'discussion' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{t('academic.literature.keyword_discussion')}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-xs">
              {t('academic.literature.discussion_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* AI Reasoning */}
            {aiReasoning && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">{t('academic.literature.ai_reasoning')}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{aiReasoning}</p>
              </div>
            )}

            {/* Analyzed topic display */}
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{t('academic.literature.analyzed_topic')}:</span>{' '}
              <span className="text-foreground">{analyzedInput}</span>
            </div>

            {/* Recommended Keywords */}
            {recommendedKeywords.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {t('academic.literature.recommended_keywords')}
                  </span>
                </div>

                {/* Keyword badges */}
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

                  {/* Add keyword button */}
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

                {/* Action buttons */}
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

            {/* Analyzing indicator */}
            {analyzing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('academic.literature.analyzing_topic')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Phase: Search ──────────────────────────────────────────────── */}
      {phase === 'search' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{t('academic.literature.title')}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* ─── Current Keywords Bar ──────────────────────────────────── */}
            {recommendedKeywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  {t('academic.literature.current_keywords')}:
                </span>
                {recommendedKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
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

            {/* ─── Search Input ──────────────────────────────────────── */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('academic.literature.smart_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-10"
                disabled={loading}
              />
            </div>

            {/* ─── Expanded queries display ──────────────────────────────── */}
            {expandedQueries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted-foreground">
                  {t('academic.literature.expanded_to') || 'Expanded to'}:
                </span>
                {expandedQueries.map((eq, i) => (
                  <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-accent" onClick={() => { setQuery(eq); }}>
                    {eq}
                  </Badge>
                ))}
              </div>
            )}

            {/* Source checkboxes + Search button */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={useSemanticScholar} onChange={(e) => setUseSemanticScholar(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                Semantic Scholar
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={useArxiv} onChange={(e) => setUseArxiv(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                arXiv
              </label>
              <Button
                onClick={() => handleSearch(0)}
                disabled={loading || !query.trim()}
                className="ml-auto"
                size="sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                {t('tool.execute')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Paper Management Panel ──────────────────────────────────── */}
      {existingPapers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setManageOpen(!manageOpen)}
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">
                  {t('academic.literature.manage_papers') || '文献管理'} ({existingPapers.length})
                </CardTitle>
              </div>
              {manageOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {manageOpen && (
            <CardContent className="space-y-2">
              {existingPapers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePaper(p)}
                    className="h-6 w-6 p-0 ml-2 text-destructive hover:text-destructive shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Complete literature search button - shown when there are existing papers */}
      {existingPapers.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={() => onCompleted?.()}
          >
            <Check className="h-4 w-4 mr-2" />
            {t('academic.literature.complete') || '完成文献检索'}
          </Button>
        </div>
      )}

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      {papers.length > 0 && (
        <Card>
          <CardContent className="py-2 px-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted-foreground font-medium">{t('academic.literature.filters')}:</span>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{t('academic.literature.filter_year')}:</span>
                <Select value={yearFilter} onValueChange={(v) => setYearFilter(v as YearFilter)}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('academic.literature.filter_all')}</SelectItem>
                    <SelectItem value="1">{t('academic.literature.filter_year_1')}</SelectItem>
                    <SelectItem value="3">{t('academic.literature.filter_year_3')}</SelectItem>
                    <SelectItem value="5">{t('academic.literature.filter_year_5')}</SelectItem>
                    <SelectItem value="10">{t('academic.literature.filter_year_10')}</SelectItem>
                    <SelectItem value="custom">{t('academic.literature.filter_year_custom')}</SelectItem>
                  </SelectContent>
                </Select>
                {yearFilter === 'custom' && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="2020"
                      value={customYearStart}
                      onChange={(e) => setCustomYearStart(e.target.value)}
                      className="h-7 w-16 text-xs"
                      min={1900}
                      max={currentYear}
                    />
                    <span className="text-muted-foreground">~</span>
                    <Input
                      type="number"
                      placeholder={String(currentYear)}
                      value={customYearEnd}
                      onChange={(e) => setCustomYearEnd(e.target.value)}
                      className="h-7 w-16 text-xs"
                      min={1900}
                      max={currentYear}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{t('academic.literature.filter_citations')}:</span>
                <Select value={citationFilter} onValueChange={(v) => setCitationFilter(v as CitationFilter)}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('academic.literature.filter_all')}</SelectItem>
                    <SelectItem value="10">≥ 10</SelectItem>
                    <SelectItem value="50">≥ 50</SelectItem>
                    <SelectItem value="100">≥ 100</SelectItem>
                    <SelectItem value="500">≥ 500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{t('academic.literature.sort_by')}:</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">{t('academic.literature.sort_relevance')}</SelectItem>
                    <SelectItem value="citations_desc">{t('academic.literature.sort_citations')}</SelectItem>
                    <SelectItem value="year_desc">{t('academic.literature.sort_year_desc')}</SelectItem>
                    <SelectItem value="year_asc">{t('academic.literature.sort_year_asc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Search Stats ────────────────────────────────────────────────── */}
      {papers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleSelectAll} className="h-7 text-xs">
              {(() => {
                const pageStart = (currentPage - 1) * PAGE_SIZE;
                const pageEnd = Math.min(pageStart + PAGE_SIZE, filteredPapers.length);
                const pageIndices = Array.from({ length: pageEnd - pageStart }, (_, i) => pageStart + i);
                const allPageSelected = pageIndices.every(i => selectedIndices.has(i));
                return allPageSelected
                  ? (t('academic.literature.deselect_all') || '取消全选')
                  : (t('academic.literature.select_all') || '全选当页');
              })()}
            </Button>
            {selectedIndices.size > 0 && (
              <Button size="sm" onClick={handleBatchAdd} disabled={batchAdding} className="h-7 text-xs">
                {batchAdding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FolderPlus className="h-3 w-3 mr-1" />}
                {t('academic.literature.batch_add') || '批量加入'} ({selectedIndices.size})
              </Button>
            )}
          </div>
          <span>
            {t('academic.literature.stats_total').replace('{count}', String(papers.length))}
          </span>
          <span className="text-border">|</span>
          <span>
            {t('academic.literature.stats_sources')}:{' '}
            {Object.entries(sourceCounts).map(([src, cnt], i) => (
              <span key={src}>
                {i > 0 && ', '}
                {src} {t('academic.literature.stats_count').replace('{count}', String(cnt))}
              </span>
            ))}
          </span>
          {ssUnavailable && (
            <>
              <span className="text-border">|</span>
              <span className="text-amber-600 dark:text-amber-400">
                {t('academic.literature.ss_unavailable')}
              </span>
            </>
          )}
          {filteredPapers.length !== papers.length && (
            <>
              <span className="text-border">|</span>
              <span>
                {t('academic.literature.stats_filtered').replace('{count}', String(filteredPapers.length))}
              </span>
            </>
          )}
        </div>
      )}

      {/* ─── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {/* ─── Paper Cards ─────────────────────────────────────────────────── */}
      {paginatedPapers.map((paper, pageIdx) => {
        const index = (currentPage - 1) * PAGE_SIZE + pageIdx;
        const isExpanded = expanded.has(index);
        const isAdded = addedIndices.has(index) || existingTitles.has(paper.title.toLowerCase());
        const isAdding = addingIndex === index;
        const highImpact = isHighImpact(paper);
        const recent = isRecent(paper);
        const showRelated = relatedPaperIndex === index;
        const verifyResult = verifyResults[index];

        return (
          <div key={`${paper.title}-${index}`}>
            <Card className="transition-all duration-200 hover:border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIndices.has(index)}
                    onChange={() => toggleSelect(index)}
                    className="mt-1 h-4 w-4 rounded accent-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm leading-snug">
                      {paper.url ? (
                        <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                          {paper.title} <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                        </a>
                      ) : paper.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ''}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{paper.source}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {paper.year && <Badge variant="secondary" className="text-xs">{paper.year}</Badge>}
                  {paper.citationCount > 0 && <Badge variant="secondary" className="text-xs">{paper.citationCount} citations</Badge>}
                  {highImpact && (
                    <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600 text-white">
                      {t('academic.literature.high_impact') || 'High Impact'}
                    </Badge>
                  )}
                  {recent && (
                    <Badge variant="default" className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                      {t('academic.literature.latest') || 'Latest'}
                    </Badge>
                  )}
                  {paper.venue && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {paper.venue}
                    </Badge>
                  )}
                  {paper.externalIds?.DOI && (
                    <a
                      href={`https://doi.org/${paper.externalIds.DOI}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      DOI <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {paper.paperId && (
                    <a
                      href={`https://www.semanticscholar.org/paper/${paper.paperId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Semantic Scholar <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {paper.externalIds?.ArXiv && (
                    <a
                      href={`https://arxiv.org/abs/${paper.externalIds.ArXiv}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      arXiv <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Abstract preview (first 2 lines) */}
                {paper.abstract && !isExpanded && (
                  <div className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                    {highlightText(paper.abstract, currentKeywords)}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {paper.abstract && (
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(index)} className="h-7 text-xs px-2">
                      {isExpanded ? <><ChevronUp className="h-3 w-3 mr-1" />{t('common.hide')}</> : <><ChevronDown className="h-3 w-3 mr-1" />{t('academic.literature.abstract') || 'Abstract'}</>}
                    </Button>
                  )}
                  {paper.paperId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchRelatedPapers(paper, index)}
                      className="h-7 text-xs px-2"
                    >
                      <Network className="h-3 w-3 mr-1" />
                      {showRelated
                        ? (t('academic.literature.hide_related') || 'Hide Related')
                        : (t('academic.literature.find_related') || 'Find Related')
                      }
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerify(paper, index)}
                    disabled={verifyingIndex === index}
                    className="h-7 text-xs px-2"
                  >
                    {verifyingIndex === index
                      ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      : <FileSearch className="h-3 w-3 mr-1" />
                    }
                    {t('academic.literature.verify')}
                  </Button>
                  <Button
                    variant={isAdded ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => !isAdded && handleAddToProject(paper, index)}
                    disabled={isAdded || isAdding}
                    className="h-7 text-xs px-2"
                  >
                    {isAdding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : isAdded ? <Check className="h-3 w-3 mr-1" /> : <FolderPlus className="h-3 w-3 mr-1" />}
                    {isAdded ? (t('academic.literature.added_to_project') || 'Added') : t('academic.literature.add_to_project')}
                  </Button>
                </div>
                {verifyResult && (
                  <div className={`mb-2 p-2 rounded-md text-xs ${
                    verifyResult.status === 'ok'
                      ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}>
                    {verifyResult.message}
                  </div>
                )}
                {isExpanded && paper.abstract && (
                  <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground leading-relaxed">
                    {highlightText(paper.abstract, currentKeywords)}
                  </div>
                )}
              </CardContent>
            </Card>

            {showRelated && (
              <Card className="ml-4 mt-1 border-l-2 border-primary/30">
                <CardContent className="p-3 space-y-2">
                  {relatedLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t('academic.literature.loading_related') || 'Loading related papers...'}
                    </div>
                  )}
                  {relatedError && (
                    <div className="text-xs text-destructive py-1">{relatedError}</div>
                  )}
                  {relatedData && (
                    <>
                      {relatedData.citations.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1.5 text-muted-foreground">
                            {t('academic.literature.cited_by') || 'Cited by'} ({relatedData.citations.length})
                          </h5>
                          <div className="space-y-1.5">
                            {relatedData.citations.slice(0, 10).map((rp, ri) => (
                              <div key={ri} className="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-muted/50">
                                <div className="flex-1 min-w-0">
                                  {rp.url ? (
                                    <a href={rp.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                      {rp.title}
                                    </a>
                                  ) : rp.title}
                                  <span className="text-muted-foreground ml-1">
                                    ({rp.year || '?'}{rp.citationCount > 0 ? `, ${rp.citationCount} cit.` : ''})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {relatedData.references.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1.5 text-muted-foreground">
                            {t('academic.literature.references') || 'References'} ({relatedData.references.length})
                          </h5>
                          <div className="space-y-1.5">
                            {relatedData.references.slice(0, 10).map((rp, ri) => (
                              <div key={ri} className="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-muted/50">
                                <div className="flex-1 min-w-0">
                                  {rp.url ? (
                                    <a href={rp.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                                      {rp.title}
                                    </a>
                                  ) : rp.title}
                                  <span className="text-muted-foreground ml-1">
                                    ({rp.year || '?'}{rp.citationCount > 0 ? `, ${rp.citationCount} cit.` : ''})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {relatedData.citations.length === 0 && relatedData.references.length === 0 && (
                        <p className="text-xs text-muted-foreground py-1">
                          {t('academic.literature.no_related') || 'No related papers found'}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}

      {/* ─── Pagination ─────────────────────────────────────────────────── */}
      {filteredPapers.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="h-8 px-3"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            {t('academic.literature.prev_page')}
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            {t('academic.literature.page_info')
              .replace('{current}', String(currentPage))
              .replace('{total}', String(totalPages))}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="h-8 px-3"
          >
            {t('academic.literature.next_page')}
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {hasMore && currentPage >= totalPages && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => handleSearch(currentOffset)} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('academic.literature.load_more') || 'Load More'}
          </Button>
        </div>
      )}

      {/* ─── Semantic Scholar Attribution ──────────────────────────────── */}
      {papers.length > 0 && (
        <div className="text-center pt-2">
          <p className="text-[10px] text-muted-foreground/60">
            Powered by{' '}
            <a
              href="https://www.semanticscholar.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-muted-foreground"
            >
              Semantic Scholar
            </a>
          </p>
        </div>
      )}

      {/* ─── Empty state ────────────────────────────────────────────────── */}
      {!loading && papers.length === 0 && query && !error && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <Search className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('academic.literature.no_results')}</p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('academic.literature.no_results_hint1')}</p>
              <p className="text-xs text-muted-foreground">{t('academic.literature.no_results_hint2')}</p>
              <p className="text-xs text-muted-foreground">{t('academic.literature.no_results_hint3')}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <p className="text-xs text-muted-foreground w-full">{t('academic.literature.try_suggestions')}:</p>
              {(() => {
                // Generate suggestions from query or use defaults
                const queryWords = query.trim().match(/\b[a-zA-Z]{3,}\b/g) || [];
                const suggestions = queryWords.length > 0
                  ? queryWords.slice(0, 5)
                  : (recommendedKeywords.length > 0 ? recommendedKeywords.slice(0, 5) : ['knowledge distillation', 'model compression', 'edge deployment']);
                return suggestions.map((s, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      setQuery(s);
                      doSearch(0, s);
                    }}
                  >
                    {s}
                  </Badge>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
