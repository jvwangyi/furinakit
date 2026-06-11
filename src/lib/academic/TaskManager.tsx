'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface Task {
  id: string;
  type: string;
  stage: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: unknown;
  error?: string;
  startedAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

interface TaskManagerContextType {
  tasks: Task[];
  submitTask: (
    type: string,
    stage: string,
    runFn: (taskId: string, onProgress: (p: number) => void, signal: AbortSignal) => Promise<unknown>,
    metadata?: Record<string, unknown>,
  ) => string;
  getTask: (id: string) => Task | undefined;
  getStageTasks: (stage: string) => Task[];
  cancelTask: (id: string) => void;
  clearCompleted: (stage: string) => void;
  restoreTasks: (savedTasks: Record<string, Task>) => void;
}

const TaskManagerContext = createContext<TaskManagerContextType | null>(null);

export function TaskManagerProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const submitTask = useCallback(
    (
      type: string,
      stage: string,
      runFn: (taskId: string, onProgress: (p: number) => void, signal: AbortSignal) => Promise<unknown>,
      metadata?: Record<string, unknown>,
    ) => {
      const taskId = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const newTask: Task = {
        id: taskId,
        type,
        stage,
        status: 'pending',
        progress: 0,
        startedAt: Date.now(),
        metadata,
      };

      setTasks(prev => [...prev, newTask]);

      // Start execution
      const controller = new AbortController();
      abortControllers.current.set(taskId, controller);

      (async () => {
        try {
          setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: 'running' } : t)));

          const result = await runFn(
            taskId,
            progress => {
              setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, progress } : t)));
            },
            controller.signal,
          );

          if (!controller.signal.aborted) {
            setTasks(prev =>
              prev.map(t =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'completed',
                      progress: 100,
                      result,
                      completedAt: Date.now(),
                    }
                  : t,
              ),
            );
          }
        } catch (e) {
          if (!controller.signal.aborted) {
            setTasks(prev =>
              prev.map(t =>
                t.id === taskId
                  ? {
                      ...t,
                      status: 'failed',
                      error: e instanceof Error ? e.message : 'Task failed',
                      completedAt: Date.now(),
                    }
                  : t,
              ),
            );
          }
        } finally {
          abortControllers.current.delete(taskId);
        }
      })();

      return taskId;
    },
    [],
  );

  const getTask = useCallback((id: string) => {
    return tasks.find(t => t.id === id);
  }, [tasks]);

  const getStageTasks = useCallback(
    (stage: string) => {
      return tasks.filter(t => t.stage === stage);
    },
    [tasks],
  );

  const cancelTask = useCallback((id: string) => {
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      setTasks(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                status: 'cancelled',
                completedAt: Date.now(),
              }
            : t,
        ),
      );
    }
  }, []);

  const clearCompleted = useCallback((stage: string) => {
    setTasks(prev =>
      prev.filter(
        t =>
          !(
            t.stage === stage &&
            (t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled')
          ),
      ),
    );
  }, []);

  const restoreTasks = useCallback((savedTasks: Record<string, Task>) => {
    // Restore completed/failed tasks from stageData
    const restored = Object.values(savedTasks).filter(
      t => t.status === 'completed' || t.status === 'failed',
    );
    setTasks(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const newTasks = restored.filter(t => !existingIds.has(t.id));
      return [...prev, ...newTasks];
    });
  }, []);

  return (
    <TaskManagerContext.Provider
      value={{
        tasks,
        submitTask,
        getTask,
        getStageTasks,
        cancelTask,
        clearCompleted,
        restoreTasks,
      }}
    >
      {children}
    </TaskManagerContext.Provider>
  );
}

export function useTaskManager() {
  const context = useContext(TaskManagerContext);
  if (!context) {
    throw new Error('useTaskManager must be used within TaskManagerProvider');
  }
  return context;
}
