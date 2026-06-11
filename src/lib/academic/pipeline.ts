/**
 * Academic Pipeline — stage definitions for the project-centered workflow.
 *
 * Flow: brainstorm → literature → review → writing → statistics → visualization → integrity → peer_review → revision → re_review → final_integrity → polishing → export → presentation → process_summary
 */

export const STAGES = {
  BRAINSTORM: 'brainstorm',
  LITERATURE: 'literature',
  REVIEW: 'review',
  WRITING: 'writing',
  STATISTICS: 'statistics',
  VISUALIZATION: 'visualization',
  INTEGRITY: 'integrity',
  PEER_REVIEW: 'peer_review',
  REVISION: 'revision',
  RE_REVIEW: 're_review',
  FINAL_INTEGRITY: 'final_integrity',
  POLISHING: 'polishing',
  EXPORT: 'export',
  PRESENTATION: 'presentation',
  PROCESS_SUMMARY: 'process_summary',
} as const;

export type Stage = (typeof STAGES)[keyof typeof STAGES];

export const STAGE_ORDER: Stage[] = [
  STAGES.BRAINSTORM,
  STAGES.LITERATURE,
  STAGES.REVIEW,
  STAGES.WRITING,
  STAGES.STATISTICS,
  STAGES.VISUALIZATION,
  STAGES.INTEGRITY,
  STAGES.PEER_REVIEW,
  STAGES.REVISION,
  STAGES.RE_REVIEW,
  STAGES.FINAL_INTEGRITY,
  STAGES.POLISHING,
  STAGES.EXPORT,
  STAGES.PRESENTATION,
  STAGES.PROCESS_SUMMARY,
];

/** Logical groups for the pipeline stages (used for UI grouping). */
export const STAGE_GROUPS = [
  { key: 'research', label: 'academic.pipeline.group.research', stages: [STAGES.BRAINSTORM, STAGES.LITERATURE, STAGES.REVIEW] as Stage[] },
  { key: 'writing', label: 'academic.pipeline.group.writing', stages: [STAGES.WRITING, STAGES.STATISTICS, STAGES.VISUALIZATION] as Stage[] },
  { key: 'review', label: 'academic.pipeline.group.review', stages: [STAGES.INTEGRITY, STAGES.PEER_REVIEW, STAGES.REVISION, STAGES.RE_REVIEW, STAGES.FINAL_INTEGRITY] as Stage[] },
  { key: 'output', label: 'academic.pipeline.group.output', stages: [STAGES.POLISHING, STAGES.EXPORT, STAGES.PRESENTATION, STAGES.PROCESS_SUMMARY] as Stage[] },
];

export interface StageConfig {
  label: string;
  description: string;
  icon: string;
  apiEndpoint: string;
}

export const STAGE_CONFIG: Record<Stage, StageConfig> = {
  [STAGES.BRAINSTORM]: {
    label: 'academic.stage.brainstorm',
    description: 'academic.stage.brainstorm_desc',
    icon: 'Lightbulb',
    apiEndpoint: '/api/academic/brainstorm',
  },
  [STAGES.LITERATURE]: {
    label: 'academic.stage.literature',
    description: 'academic.stage.literature_desc',
    icon: 'BookOpen',
    apiEndpoint: '/api/academic/search',
  },
  [STAGES.REVIEW]: {
    label: 'academic.stage.review',
    description: 'academic.stage.review_desc',
    icon: 'Sparkles',
    apiEndpoint: '/api/academic/review',
  },
  [STAGES.WRITING]: {
    label: 'academic.stage.writing',
    description: 'academic.stage.writing_desc',
    icon: 'PenLine',
    apiEndpoint: '/api/academic/writing',
  },
  [STAGES.STATISTICS]: {
    label: 'academic.stage.statistics',
    description: 'academic.stage.statistics_desc',
    icon: 'Calculator',
    apiEndpoint: '/api/academic/statistics',
  },
  [STAGES.VISUALIZATION]: {
    label: 'academic.stage.visualization',
    description: 'academic.stage.visualization_desc',
    icon: 'BarChart',
    apiEndpoint: '/api/academic/visualization',
  },
  [STAGES.INTEGRITY]: {
    label: 'academic.stage.integrity',
    description: 'academic.stage.integrity_desc',
    icon: 'ShieldCheck',
    apiEndpoint: '/api/academic/integrity',
  },
  [STAGES.PEER_REVIEW]: {
    label: 'academic.stage.peer_review',
    description: 'academic.stage.peer_review_desc',
    icon: 'Users',
    apiEndpoint: '/api/academic/assess',
  },
  [STAGES.REVISION]: {
    label: 'academic.stage.revision',
    description: 'academic.stage.revision_desc',
    icon: 'Pencil',
    apiEndpoint: '/api/academic/projects',
  },
  [STAGES.RE_REVIEW]: {
    label: 'academic.stage.re_review',
    description: 'academic.stage.re_review_desc',
    icon: 'RefreshCw',
    apiEndpoint: '/api/academic/assess',
  },
  [STAGES.FINAL_INTEGRITY]: {
    label: 'academic.stage.final_integrity',
    description: 'academic.stage.final_integrity_desc',
    icon: 'ShieldAlert',
    apiEndpoint: '/api/academic/integrity',
  },
  [STAGES.POLISHING]: {
    label: 'academic.stage.polishing',
    description: 'academic.stage.polishing_desc',
    icon: 'Wand2',
    apiEndpoint: '/api/academic/polishing',
  },
  [STAGES.EXPORT]: {
    label: 'academic.stage.export',
    description: 'academic.stage.export_desc',
    icon: 'Download',
    apiEndpoint: '/api/academic/export',
  },
  [STAGES.PRESENTATION]: {
    label: 'academic.stage.presentation',
    description: 'academic.stage.presentation_desc',
    icon: 'Presentation',
    apiEndpoint: '/api/academic/presentation',
  },
  [STAGES.PROCESS_SUMMARY]: {
    label: 'academic.stage.process_summary',
    description: 'academic.stage.process_summary_desc',
    icon: 'BarChart3',
    apiEndpoint: '/api/academic/summary',
  },
};

/** Return the index of a stage in the pipeline (-1 if unknown). */
export function stageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage as Stage);
}

/** Check whether `target` is reachable from `current` (i.e. target <= current + 1). */
export function isStageAccessible(current: string, target: string): boolean {
  return true;
}

/** Stage status relative to the current stage. */
export function stageStatus(
  current: string,
  target: string,
): 'completed' | 'current' | 'accessible' | 'locked' {
  const ci = stageIndex(current);
  const ti = stageIndex(target);
  if (ci < 0 || ti < 0) return 'locked';
  if (ti < ci) return 'completed';
  if (ti === ci) return 'current';
  if (ti === ci + 1) return 'accessible';
  return 'locked';
}
