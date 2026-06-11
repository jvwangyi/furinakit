'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

/**
 * A single version/variant of a stage's output.
 * `content` is generic — each stage interprets it as needed (string, object, array, etc.)
 */
export interface StageVersion<T = unknown> {
  id: string;
  content: T;
  label: string;
  createdAt: number;
  config?: Record<string, unknown>;
}

/**
 * The persisted shape every stage stores in stageData[stageKey].
 *
 * - versions: all saved versions
 * - activeVersionId: what the user is currently viewing/editing
 * - completedVersionId: the locked output (what downstream stages read)
 */
export interface StageVersionData<T = unknown> {
  versions: StageVersion<T>[];
  activeVersionId: string;
  completedVersionId: string;
}

function makeId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Migrate legacy stage data into the version format.
 */
export function migrateToVersions<T>(raw: Record<string, unknown> | null | undefined): StageVersionData<T> {
  if (!raw) return { versions: [], activeVersionId: '', completedVersionId: '' };

  // Already new format
  if (Array.isArray(raw.versions)) {
    return {
      versions: (raw.versions as StageVersion<T>[]).map(v => ({
        ...v,
        createdAt: v.createdAt || Date.now(),
      })),
      activeVersionId: (raw.activeVersionId as string) || '',
      completedVersionId: (raw.completedVersionId as string) || '',
    };
  }

  // Legacy: { content } → single version
  if ('content' in raw && raw.content !== undefined && raw.content !== null && raw.content !== '') {
    const { content, ...rest } = raw;
    const v: StageVersion<T> = {
      id: makeId(),
      content: content as T,
      label: 'v1',
      createdAt: Date.now(),
      config: Object.keys(rest).length > 0 ? rest : undefined,
    };
    return { versions: [v], activeVersionId: v.id, completedVersionId: v.id };
  }

  // Legacy: { rqBrief } → single version
  if ('rqBrief' in raw && raw.rqBrief !== undefined && raw.rqBrief !== null) {
    const v: StageVersion<T> = {
      id: makeId(),
      content: raw.rqBrief as T,
      label: 'v1',
      createdAt: Date.now(),
    };
    return { versions: [v], activeVersionId: v.id, completedVersionId: v.id };
  }

  return { versions: [], activeVersionId: '', completedVersionId: '' };
}

export interface UseStageVersionsOptions<T> {
  stageKey: string;
  savedData?: Record<string, unknown> | null;
  saveStageData?: (stage: string, data: unknown) => void;
  summarize?: (content: T) => string;
}

export interface UseStageVersionsReturn<T> {
  // ── All versions ──
  versions: StageVersion<T>[];
  hasVersions: boolean;

  // ── Active version (what user is viewing/editing) ──
  activeVersion: StageVersion<T> | null;
  activeContent: T | null;
  activeVersionId: string;

  // ── Completed version (locked output, passed to next stage) ──
  completedVersion: StageVersion<T> | null;
  completedContent: T | null;
  completedVersionId: string;
  isCompleted: boolean;

  // ── Version actions ──
  addVersion: (content: T, config?: Record<string, unknown>, label?: string) => void;
  updateActiveContent: (content: T) => void;
  switchVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  getLabel: (v: StageVersion<T>) => string;

  // ── Stage completion ──
  /** Lock the current active version as the stage's output */
  completeStage: () => void;
  /** Unlock (re-open the stage for editing) */
  uncompleteStage: () => void;

  // ── Edit mode ──
  editing: boolean;
  startEditing: () => void;
  stopEditing: () => void;
}

export function useStageVersions<T = string>({
  stageKey,
  savedData,
  saveStageData,
  summarize,
}: UseStageVersionsOptions<T>): UseStageVersionsReturn<T> {
  // ── Internal state ──
  const [data, setData] = useState<StageVersionData<T>>(() => migrateToVersions<T>(savedData));
  const [activeVersionId, setActiveVersionId] = useState<string>(() => {
    const migrated = migrateToVersions<T>(savedData);
    return migrated.activeVersionId || (migrated.versions[0]?.id ?? '');
  });

  // ── Edit mode: read-only when completed, editable otherwise ──
  const [editing, setEditing] = useState(() => {
    const migrated = migrateToVersions<T>(savedData);
    return migrated.versions.length === 0; // edit mode only when empty
  });
  const startEditing = useCallback(() => setEditing(true), []);
  const stopEditing = useCallback(() => setEditing(false), []);

  // ── Sync from savedData ──
  useEffect(() => {
    const migrated = migrateToVersions<T>(savedData);
    if (migrated.versions.length > 0) {
      const currentIds = new Set(data.versions.map(v => v.id));
      const hasNew = migrated.versions.some(v => !currentIds.has(v.id));
      if (hasNew) {
        setData(migrated);
        if (migrated.activeVersionId && migrated.activeVersionId !== activeVersionId) {
          setActiveVersionId(migrated.activeVersionId);
        }
      }
    }
    // Auto-persist migrated old format
    if (savedData && !Array.isArray(savedData.versions) && migrated.versions.length > 0) {
      saveStageData?.(stageKey, migrated);
    }
  }, [savedData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist helper ──
  const persist = useCallback((next: StageVersionData<T>) => {
    setData(next);
    if (next.activeVersionId) setActiveVersionId(next.activeVersionId);
    saveStageData?.(stageKey, next);
  }, [saveStageData, stageKey]);

  const persistRef = useRef(persist);
  useEffect(() => { persistRef.current = persist; }, [persist]);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // ── Derived ──
  const activeVersion = useMemo(
    () => data.versions.find(v => v.id === activeVersionId) || null,
    [data.versions, activeVersionId],
  );

  const completedVersion = useMemo(
    () => data.versions.find(v => v.id === data.completedVersionId) || null,
    [data.versions, data.completedVersionId],
  );

  // ── Actions ──
  const addVersion = useCallback((content: T, config?: Record<string, unknown>, label?: string) => {
    const current = dataRef.current;
    const newId = makeId();
    const newVersion: StageVersion<T> = {
      id: newId,
      content,
      label: label || `v${current.versions.length + 1}`,
      createdAt: Date.now(),
      config,
    };
    persistRef.current({
      ...current,
      versions: [...current.versions, newVersion],
      activeVersionId: newId,
    });
  }, []);

  const updateActiveContent = useCallback((content: T) => {
    const current = dataRef.current;
    if (!current.activeVersionId) {
      // No versions yet — create one
      const newId = makeId();
      persistRef.current({
        versions: [{ id: newId, content, label: 'v1', createdAt: Date.now() }],
        activeVersionId: newId,
        completedVersionId: current.completedVersionId,
      });
      return;
    }
    const updatedVersions = current.versions.map(v =>
      v.id === current.activeVersionId ? { ...v, content } : v,
    );
    persistRef.current({ ...current, versions: updatedVersions });
  }, []);

  const switchVersion = useCallback((id: string) => {
    setActiveVersionId(id);
    const current = dataRef.current;
    persistRef.current({ ...current, activeVersionId: id });
  }, []);

  const deleteVersion = useCallback((id: string) => {
    const current = dataRef.current;
    const remaining = current.versions.filter(v => v.id !== id);
    const newActiveId = activeVersionId === id
      ? (remaining[remaining.length - 1]?.id ?? '')
      : activeVersionId;
    const newCompletedId = current.completedVersionId === id ? '' : current.completedVersionId;
    persistRef.current({
      versions: remaining,
      activeVersionId: newActiveId,
      completedVersionId: newCompletedId,
    });
  }, [activeVersionId]);

  // ── Stage completion ──
  const completeStage = useCallback(() => {
    const current = dataRef.current;
    if (!current.activeVersionId) return;
    persistRef.current({
      ...current,
      completedVersionId: current.activeVersionId,
    });
    setEditing(false); // lock editing on complete
  }, []);

  const uncompleteStage = useCallback(() => {
    const current = dataRef.current;
    persistRef.current({
      ...current,
      completedVersionId: '',
    });
    setEditing(true); // allow editing on uncomplete
  }, []);

  const getLabel = useCallback((v: StageVersion<T>) => {
    if (summarize) {
      const summary = summarize(v.content);
      return summary ? `${v.label} — ${summary}` : v.label;
    }
    return v.label;
  }, [summarize]);

  return {
    versions: data.versions,
    hasVersions: data.versions.length > 0,

    activeVersion,
    activeContent: activeVersion?.content ?? null,
    activeVersionId,

    completedVersion,
    completedContent: completedVersion?.content ?? null,
    completedVersionId: data.completedVersionId,
    isCompleted: !!data.completedVersionId,

    addVersion,
    updateActiveContent,
    switchVersion,
    deleteVersion,
    getLabel,

    completeStage,
    uncompleteStage,

    editing,
    startEditing,
    stopEditing,

    ...({ persistRef, dataRef } as unknown as Record<string, never>),
  } as UseStageVersionsReturn<T> & { persistRef: typeof persistRef; dataRef: typeof dataRef };
}
