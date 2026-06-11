'use client';

import { useState, useEffect, useCallback, use, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { STAGE_ORDER, STAGES, isStageAccessible, type Stage } from '@/lib/academic/pipeline';
import { Check } from 'lucide-react';
import {
  PipelineStepper,
  BrainstormStage,
  LiteratureStage,
  ReviewStage,
  WritingStage,
  IntegrityStage,
  PeerReviewStage,
  RevisionStage,
  ExportStage,
  ReReviewStage,
  FinalIntegrityStage,
  StatisticsStage,
  VisualizationStage,
  PolishingStage,
  PresentationStage,
  ProcessSummaryStage,
} from '@/components/academic/pipeline';
import { LLMProvider, useLLM } from '@/components/academic/LLMProvider';
import { TaskManagerProvider, useTaskManager } from '@/lib/academic/TaskManager';
import { ApiKeySelector } from '@/components/academic/ApiKeySelector';
import {
  ArrowLeft,
  FolderKanban,
  Loader2,
  AlertCircle,
  Clock,
  ChevronRight,
  Settings,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  abstract: string | null;
  url: string | null;
  doi: string | null;
  citationKey: string | null;
  addedAt: string;
}

interface Review {
  id: string;
  type: string;
  content: string;
  config: string | null;
  score: number | null;
  verdict: string | null;
  stage: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  stage: string;
  stageData: string | null;
  createdAt: string;
  updatedAt: string;
  papers: Paper[];
  reviews: Review[];
  _count: {
    papers: number;
    reviews: number;
    drafts: number;
  };
}

function ProjectDetailPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const { settings, openSettings } = useLLM();
  const { restoreTasks } = useTaskManager();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string>(STAGES.BRAINSTORM);
  const [stageCompleted, setStageCompleted] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  // Stage confirmation flow
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<Record<string, unknown>>({});
  const [confirmEdit, setConfirmEdit] = useState('');

  // Parse stageData from project
  const stageData = useMemo(() => {
    if (!project?.stageData) return {} as Record<string, unknown>;
    try {
      return typeof project.stageData === 'string' ? JSON.parse(project.stageData) : project.stageData;
    } catch {
      return {} as Record<string, unknown>;
    }
  }, [project?.stageData]);

  // Save data to a specific stage in stageData
  const saveStageData = useCallback(async (stage: string, data: unknown) => {
    const updated = { ...stageData, [stage]: data };
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageData: updated }),
      });
      // Immediately update local project state so next stage can read it
      setProject(prev => prev ? { ...prev, stageData: JSON.stringify(updated) } : prev);
    } catch (e) {
      console.error('Failed to save stage data:', e);
    }
  }, [id, stageData]);

  // Get data from a specific stage
  const getStageData = useCallback((stage: string) => stageData[stage] || null, [stageData]);

  // Get active version content from stageData, handling both old and new format
  // For downstream stages: reads completedVersionId (locked output)
  // For the stage itself: reads activeVersionId (what user is viewing)
  const getStageContent = useCallback((stage: string): Record<string, unknown> | null => {
    const sd = stageData[stage] as Record<string, unknown> | undefined;
    if (!sd) return null;
    // New format: extract completed version content (for downstream stages)
    if (Array.isArray(sd.versions) && sd.completedVersionId) {
      const completed = (sd.versions as Array<Record<string, unknown>>).find(v => v.id === sd.completedVersionId);
      if (completed?.content) return completed.content as Record<string, unknown>;
    }
    // Fallback: active version (for the stage itself)
    if (Array.isArray(sd.versions) && sd.activeVersionId) {
      const active = (sd.versions as Array<Record<string, unknown>>).find(v => v.id === sd.activeVersionId);
      if (active?.content) return active.content as Record<string, unknown>;
    }
    // Old format: return as-is
    return sd;
  }, [stageData]);

  // Get the latest review content for a given stage type.
  // Prioritizes the active version from stageData (real-time) over saved reviews (DB).
  const getLatestReviewContent = useCallback((type: string, stage: string): string | undefined => {
    // First try stageData for active version content
    const sd = stageData[stage] as Record<string, unknown> | undefined;
    if (sd?.versions && Array.isArray(sd.versions) && sd.activeVersionId) {
      const active = (sd.versions as Array<Record<string, unknown>>).find(
        (v) => v.id === sd.activeVersionId
      );
      if (active?.content) return active.content as string;
    }
    // Fallback to saved reviews in DB
    return project?.reviews?.find((r: { type: string; stage?: string | null }) => r.type === type || r.stage === stage)?.content;
  }, [stageData, project?.reviews]);

  const fetchProject = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${id}`));
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
        // Only set activeStage from DB on initial load
        if (!initialLoadDone.current) {
          setActiveStage(data.data.stage || STAGES.BRAINSTORM);
          initialLoadDone.current = true;
        }
      } else {
        setError(data.error || 'Failed to fetch project');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Restore tasks from stageData when project loads
  useEffect(() => {
    if (stageData && Object.keys(stageData).length > 0) {
      const savedTasks: Record<string, import('@/lib/academic/TaskManager').Task> = {};
      for (const [key, value] of Object.entries(stageData)) {
        if (key.endsWith('_tasks') && value && typeof value === 'object') {
          Object.assign(savedTasks, value);
        }
      }
      if (Object.keys(savedTasks).length > 0) {
        restoreTasks(savedTasks);
      }
    }
  }, [stageData, restoreTasks]);

  const handleStageClick = (stage: Stage) => {
    if (!project) return;
    if (isStageAccessible(project.stage, stage) || stage === project.stage) {
      setActiveStage(stage);
    }
  };

  // Mark a stage as completed
  const markStageCompleted = useCallback((stage: string) => {
    setStageCompleted(prev => new Set(prev).add(stage));
  }, []);

  const handleAdvanceStage = async () => {
    if (!project) return;
    const currentIndex = STAGE_ORDER.indexOf(project.stage as Stage);
    if (currentIndex < 0 || currentIndex >= STAGE_ORDER.length - 1) return;

    // Check if current stage is completed
    if (!stageCompleted.has(project.stage)) {
      setError(t('academic.pipeline.complete_first') || '请先完成当前阶段再进入下一阶段');
      return;
    }

    const nextStage = STAGE_ORDER[currentIndex + 1];
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json();
      if (data.success) {
        setProject(prev => prev ? { ...prev, stage: nextStage } : prev);
        setActiveStage(nextStage);
      } else {
        setError(data.error || 'Failed to advance stage');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
          <p className="text-lg text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/academic/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('academic.projects.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const mapReviews = (reviews: Review[]) => {
    const mapped = reviews.map(r => ({ ...r, stage: r.stage ?? undefined }));
    // Inject active version from stageData so downstream stages always see latest
    const reviewSd = stageData.review as Record<string, unknown> | undefined;
    if (reviewSd?.versions && Array.isArray(reviewSd.versions) && reviewSd.activeVersionId) {
      const active = (reviewSd.versions as Array<Record<string, unknown>>).find(
        (v) => v.id === reviewSd.activeVersionId
      );
      if (active?.content) {
        const idx = mapped.findIndex(r => r.stage === 'review' || r.type === 'literature_review');
        if (idx >= 0) {
          mapped[idx] = { ...mapped[idx], content: active.content as string };
        } else {
          mapped.push({ id: '', type: 'literature_review', content: active.content as string, stage: 'review', config: null, score: null, verdict: null, createdAt: new Date().toISOString() });
        }
      }
    }
    return mapped;
  };

  const currentStageIndex = STAGE_ORDER.indexOf(project.stage as Stage);
  const canAdvance = currentStageIndex >= 0 && currentStageIndex < STAGE_ORDER.length - 1;
  const isViewingCurrentStage = activeStage === project.stage;

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/academic/projects')}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('academic.projects.back')}
            </Button>
            <ApiKeySelector />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground text-sm">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {project.topic && <Badge variant="secondary">{project.topic}</Badge>}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(project.updatedAt)}
            </span>
          </div>
        </div>

        {/* Pipeline Stepper */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t('academic.pipeline.progress')}</span>
              <Badge variant="outline" className="text-xs">
                {t('academic.pipeline.current')}: {t(`academic.stage.${project.stage}`)}
              </Badge>
            </div>
            <PipelineStepper currentStage={project.stage} onStageClick={handleStageClick} />
          </CardContent>
        </Card>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="flex-1">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setError(null); fetchProject(); }}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                {t('academic.common.retry') }
              </Button>
            </div>
          </div>
        )}

        {/* Complete Stage Button */}
        {project && activeStage === project.stage && !stageCompleted.has(project.stage) && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => markStageCompleted(project.stage)}
              size="sm"
              className="h-8 text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              {t('academic.pipeline.complete_stage') || '✓ 完成此阶段'}
            </Button>
          </div>
        )}
        {project && stageCompleted.has(project.stage) && activeStage === project.stage && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={handleAdvanceStage}
              size="sm"
              variant="default"
              className="h-8 text-xs"
            >
              <ChevronRight className="h-3.5 w-3.5 mr-1.5" />
              {t('academic.pipeline.advance_stage') || '进入下一阶段'}
            </Button>
          </div>
        )}

        {/* Stage Content */}
        <div className="mb-4">
          {activeStage === STAGES.BRAINSTORM && (
            <BrainstormStage
              projectId={project.id}
              onSaved={fetchProject}
              savedData={getStageData('brainstorm')}
              onCompleted={() => markStageCompleted(STAGES.BRAINSTORM)}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.LITERATURE && (
            <LiteratureStage
              projectId={project.id}
              existingPapers={project.papers.map(p => ({ id: p.id, title: p.title, doi: p.doi }))}
              onPaperAdded={() => fetchProject(true)}
              savedData={getStageData('literature')}
              initialKeywords={(getStageContent('brainstorm')?.keywords as string[]) || []}
              initialQuery={(getStageContent('brainstorm')?.optimized_query as string) || ''}
              onCompleted={async () => {
                markStageCompleted(STAGES.LITERATURE);
                // Auto-advance to next stage
                const currentIndex = STAGE_ORDER.indexOf(STAGES.LITERATURE);
                if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
                  const nextStage = STAGE_ORDER[currentIndex + 1];
                  try {
                    const res = await fetch(apiPath(`/api/academic/projects/${id}`), {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ stage: nextStage }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setProject(prev => prev ? { ...prev, stage: nextStage } : prev);
                      setActiveStage(nextStage);
                    }
                  } catch (e) {
                    console.error('Failed to advance stage:', e);
                  }
                }
              }}
            />
          )}

          {activeStage === STAGES.REVIEW && (
            <ReviewStage
              projectId={project.id}
              papers={project.papers}
              existingReviews={mapReviews(project.reviews)}
              topic={project.topic || (getStageContent('brainstorm')?.research_question as string) || ''}
              onReviewSaved={fetchProject}
              savedData={getStageData('review')}
              onCompleted={() => markStageCompleted(STAGES.REVIEW)}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.WRITING && (
            <WritingStage
              projectId={project.id}
              papers={project.papers}
              existingReviews={mapReviews(project.reviews)}
              topic={project.topic || (getStageContent('brainstorm')?.research_question as string) || ''}
              outline={getStageData('writing')?.outline || ''}
              onSaved={fetchProject}
              savedData={getStageData('writing')}
              onCompleted={() => markStageCompleted(STAGES.WRITING)}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.INTEGRITY && (
            <IntegrityStage
              projectId={project.id}
              existingReviews={mapReviews(project.reviews)}
              defaultContent={getLatestReviewContent('literature_review', 'review')}
              onSaved={fetchProject}
              savedData={getStageData('integrity')}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.PEER_REVIEW && (
            <PeerReviewStage
              projectId={project.id}
              existingReviews={mapReviews(project.reviews)}
              defaultContent={getLatestReviewContent('literature_review', 'review')}
              onSaved={fetchProject}
              savedData={getStageData('peer_review')}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.REVISION && (
            <RevisionStage
              projectId={project.id}
              existingReviews={mapReviews(project.reviews)}
              onSaved={fetchProject}
            />
          )}

          {activeStage === STAGES.RE_REVIEW && (
            <ReReviewStage
              projectId={project.id}
              existingReviews={mapReviews(project.reviews)}
              onSaved={fetchProject}
              savedData={getStageData('re_review')}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.FINAL_INTEGRITY && (
            <FinalIntegrityStage
              projectId={project.id}
              existingReviews={mapReviews(project.reviews)}
              defaultContent={getLatestReviewContent('literature_review', 'review')}
              onSaved={fetchProject}
              savedData={getStageData('final_integrity')}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.STATISTICS && (
            <StatisticsStage
              projectId={project.id}
              onSaved={fetchProject}
            />
          )}

          {activeStage === STAGES.VISUALIZATION && (
            <VisualizationStage
              projectId={project.id}
              onSaved={fetchProject}
            />
          )}

          {activeStage === STAGES.POLISHING && (
            <PolishingStage
              projectId={project.id}
              existingContent={getLatestReviewContent('literature_review', 'review')}
              onSaved={fetchProject}
              savedData={getStageData('polishing')}
              saveStageData={saveStageData}
            />
          )}

          {activeStage === STAGES.EXPORT && (
            <ExportStage
              projectId={project.id}
              projectName={project.name}
              reviews={mapReviews(project.reviews)}
            />
          )}

          {activeStage === STAGES.PRESENTATION && (
            <PresentationStage
              projectId={project.id}
              paperContent={project.reviews.find(r => r.type === 'literature_review' || r.stage === 'review')?.content}
              onSaved={fetchProject}
            />
          )}

          {activeStage === STAGES.PROCESS_SUMMARY && (
            <ProcessSummaryStage
              projectId={project.id}
              projectName={project.name}
              topic={project.topic}
              reviews={mapReviews(project.reviews)}
              paperCount={project._count.papers}
              papers={project.papers.map(p => ({ title: p.title, authors: p.authors, year: p.year }))}
            />
          )}
        </div>

        {/* Advance Stage Button (hidden - all stages always accessible) */}
        {/* {canAdvance && isViewingCurrentStage && (
          ...
        )} */}
      </div>
    </div>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <LLMProvider>
      <TaskManagerProvider>
        <ProjectDetailPageInner params={params} />
      </TaskManagerProvider>
    </LLMProvider>
  );
}