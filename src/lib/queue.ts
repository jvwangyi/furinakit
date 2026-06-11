/**
 * Lightweight in-memory task queue for batch file processing.
 * No external dependencies — uses Node.js native APIs only.
 */

import { createProgress, updateProgress, completeProgress, failProgress } from './progress';
import { dispatchWebhook } from './webhook';

// ── Types ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface TaskDefinition {
  /** Tool name to execute (e.g. 'pdf-merge', 'image-compress') */
  toolName: string;
  /** Input to pass to tool.execute() */
  input: Record<string, unknown>;
  /** Optional display name for progress tracking */
  label?: string;
  /** Priority (default: 'normal') */
  priority?: TaskPriority;
}

export interface TaskEntry {
  id: string;
  batchId: string;
  toolName: string;
  label: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  progressId: string;
  /** Input to pass to the tool executor */
  input: Record<string, unknown>;
  /** Stored result — only kept for completed tasks until cleanup */
  result: unknown | null;
  error: string | null;
  enqueuedAt: number;
  startedAt: number | null;
  completedAt: number | null;
  /** AbortController for timeout / cancellation */
  abortController: AbortController;
}

export interface BatchEntry {
  id: string;
  taskIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  completedAt: number | null;
}

export interface QueueStatus {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
  maxConcurrency: number;
  batches: number;
}

export interface BatchProgress {
  batchId: string;
  status: BatchEntry['status'];
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  progress: number; // 0-100 aggregate
  tasks: Array<{
    id: string;
    label: string;
    status: TaskStatus;
    progress: number;
    error: string | null;
  }>;
  createdAt: number;
  completedAt: number | null;
}

// ── Queue Configuration ─────────────────────────────────────────────────────

export interface QueueConfig {
  /** Max tasks running in parallel (default: 3) */
  maxConcurrency: number;
  /** Per-task timeout in ms (default: 5 min) */
  taskTimeoutMs: number;
  /** Max completed task results to keep (default: 100) */
  maxCompletedResults: number;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrency: 3,
  taskTimeoutMs: 5 * 60 * 1000,
  maxCompletedResults: 100,
};

// ── Priority ordering ───────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

// ── Queue Implementation ────────────────────────────────────────────────────

class TaskQueue {
  private tasks = new Map<string, TaskEntry>();
  private batches = new Map<string, BatchEntry>();
  private pendingQueue: string[] = []; // task ids ordered by priority
  private config: QueueConfig;
  private runningCount = 0;
  private taskExecutor: ((toolName: string, input: Record<string, unknown>) => Promise<unknown>) | null = null;

  constructor(config?: Partial<QueueConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register the tool executor function.
   * This should be called once at app startup with the actual tool runner.
   */
  setExecutor(executor: (toolName: string, input: Record<string, unknown>) => Promise<unknown>) {
    this.taskExecutor = executor;
  }

  /**
   * Submit a batch of tasks. Returns batchId immediately.
   */
  enqueueBatch(tasks: TaskDefinition[]): { batchId: string; taskIds: string[] } {
    const batchId = generateId('batch');
    const taskIds: string[] = [];

    for (const def of tasks) {
      const id = generateId('task');
      const progressId = `queue-${id}`;

      // Register with existing progress system
      createProgress(progressId, def.toolName);

      const entry: TaskEntry = {
        id,
        batchId,
        toolName: def.toolName,
        label: def.label || def.toolName,
        priority: def.priority || 'normal',
        status: 'pending',
        progress: 0,
        progressId,
        input: def.input,
        result: null,
        error: null,
        enqueuedAt: Date.now(),
        startedAt: null,
        completedAt: null,
        abortController: new AbortController(),
      };

      this.tasks.set(id, entry);
      taskIds.push(id);
    }

    // Insert into pending queue respecting priority
    for (const id of taskIds) {
      this.insertByPriority(id);
    }

    const batch: BatchEntry = {
      id: batchId,
      taskIds,
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
    };
    this.batches.set(batchId, batch);

    // Try to start tasks immediately
    this.processNext();

    return { batchId, taskIds };
  }

  /**
   * Enqueue a single task (convenience wrapper).
   */
  enqueue(task: TaskDefinition): { taskId: string; batchId: string } {
    const { batchId, taskIds } = this.enqueueBatch([task]);
    return { taskId: taskIds[0], batchId };
  }

  /**
   * Get overall queue status.
   */
  getStatus(): QueueStatus {
    let pending = 0, running = 0, completed = 0, failed = 0;
    for (const t of this.tasks.values()) {
      if (t.status === 'pending') pending++;
      else if (t.status === 'running') running++;
      else if (t.status === 'completed') completed++;
      else if (t.status === 'failed') failed++;
    }
    return {
      pending,
      running,
      completed,
      failed,
      total: this.tasks.size,
      maxConcurrency: this.config.maxConcurrency,
      batches: this.batches.size,
    };
  }

  /**
   * Get detailed progress for a batch.
   */
  getBatchProgress(batchId: string): BatchProgress | null {
    const batch = this.batches.get(batchId);
    if (!batch) return null;

    const taskDetails = batch.taskIds.map(tid => {
      const t = this.tasks.get(tid)!;
      return {
        id: t.id,
        label: t.label,
        status: t.status,
        progress: t.progress,
        error: t.error,
      };
    });

    const completedTasks = taskDetails.filter(t => t.status === 'completed').length;
    const failedTasks = taskDetails.filter(t => t.status === 'failed').length;
    const totalProgress = taskDetails.reduce((sum, t) => sum + t.progress, 0) / (taskDetails.length || 1);

    return {
      batchId,
      status: batch.status,
      totalTasks: taskDetails.length,
      completedTasks,
      failedTasks,
      progress: Math.round(totalProgress),
      tasks: taskDetails,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
    };
  }

  /**
   * Get a single task's details.
   */
  getTask(taskId: string): TaskEntry | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Cancel a pending or running task.
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;
    if (task.status === 'completed' || task.status === 'failed') return false;

    task.abortController.abort();
    if (task.status === 'pending') {
      this.pendingQueue = this.pendingQueue.filter(id => id !== taskId);
    }
    const wasRunning = task.status === 'running';
    task.status = 'failed';
    task.error = 'Cancelled';
    task.completedAt = Date.now();
    failProgress(task.progressId, 'Cancelled');

    if (wasRunning) {
      this.runningCount--;
    }

    this.updateBatchStatus(task.batchId);
    this.processNext();
    return true;
  }

  /**
   * Cancel an entire batch.
   */
  cancelBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) return false;
    for (const tid of batch.taskIds) {
      this.cancelTask(tid);
    }
    return true;
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private insertByPriority(taskId: string) {
    const task = this.tasks.get(taskId)!;
    const weight = PRIORITY_WEIGHT[task.priority];

    let insertIdx = this.pendingQueue.length;
    for (let i = 0; i < this.pendingQueue.length; i++) {
      const existing = this.tasks.get(this.pendingQueue[i])!;
      if (weight < PRIORITY_WEIGHT[existing.priority]) {
        insertIdx = i;
        break;
      }
    }
    this.pendingQueue.splice(insertIdx, 0, taskId);
  }

  private processNext() {
    while (this.runningCount < this.config.maxConcurrency && this.pendingQueue.length > 0) {
      const taskId = this.pendingQueue.shift()!;
      const task = this.tasks.get(taskId);
      if (!task || task.status !== 'pending') continue;

      this.runningCount++;
      task.status = 'running';
      task.startedAt = Date.now();
      updateProgress(task.progressId, 0, 'Processing...');

      // Update batch status
      const batch = this.batches.get(task.batchId);
      if (batch && batch.status === 'pending') {
        batch.status = 'running';
      }

      this.executeTask(task);
    }
  }

  private async executeTask(task: TaskEntry) {
    const timeout = this.config.taskTimeoutMs;

    const startedAt = task.startedAt ?? Date.now();

    try {
      if (!this.taskExecutor) {
        throw new Error('No task executor registered. Call queue.setExecutor() first.');
      }

      // Race between execution and timeout
      const result = await Promise.race([
        this.taskExecutor(task.toolName, task.input),
        new Promise((_, reject) => {
          const timer = setTimeout(() => reject(new Error('Task timed out')), timeout);
          task.abortController.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Task cancelled'));
          });
        }),
      ]);

      task.status = 'completed';
      task.progress = 100;
      task.result = result;
      task.completedAt = Date.now();
      completeProgress(task.progressId);

      // Fire-and-forget webhook notification
      dispatchWebhook('task.completed', {
        taskId: task.id,
        batchId: task.batchId,
        toolName: task.toolName,
        status: 'completed',
        duration: task.completedAt - startedAt,
      });
    } catch (err) {
      task.status = 'failed';
      task.error = err instanceof Error ? err.message : String(err);
      task.completedAt = Date.now();
      failProgress(task.progressId, task.error);

      // Fire-and-forget webhook notification
      dispatchWebhook('task.failed', {
        taskId: task.id,
        batchId: task.batchId,
        toolName: task.toolName,
        status: 'failed',
        error: task.error,
        duration: task.completedAt - startedAt,
      });
    } finally {
      this.runningCount--;
      this.updateBatchStatus(task.batchId);
      this.cleanup();
      this.processNext();
    }
  }

  private updateBatchStatus(batchId: string) {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    const tasks = batch.taskIds.map(id => this.tasks.get(id)!);
    const allDone = tasks.every(t => t.status === 'completed' || t.status === 'failed');
    const anyFailed = tasks.some(t => t.status === 'failed');

    if (allDone) {
      batch.status = anyFailed ? 'failed' : 'completed';
      batch.completedAt = Date.now();

      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const failedTasks = tasks.filter(t => t.status === 'failed').length;
      const duration = batch.completedAt - batch.createdAt;

      // Fire-and-forget webhook notification for batch completion
      const event = anyFailed ? 'batch.failed' : 'batch.completed';
      dispatchWebhook(event, {
        batchId,
        status: batch.status,
        totalTasks: tasks.length,
        completedTasks,
        failedTasks,
        duration,
      });
    }
  }

  /**
   * Trim old completed/failed tasks to limit memory usage.
   */
  private cleanup() {
    const max = this.config.maxCompletedResults;
    const finished: TaskEntry[] = [];

    for (const task of this.tasks.values()) {
      if (task.status === 'completed' || task.status === 'failed') {
        finished.push(task);
      }
    }

    if (finished.length <= max) return;

    // Sort oldest first, remove excess
    finished.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
    const toRemove = finished.slice(0, finished.length - max);

    for (const task of toRemove) {
      task.result = null; // Release large result buffers
      task.input = {} as Record<string, unknown>; // Release input file buffers
      this.tasks.delete(task.id);
    }

    // Also clean up orphaned batches
    for (const [batchId, batch] of this.batches.entries()) {
      const hasTasks = batch.taskIds.some(id => this.tasks.has(id));
      if (!hasTasks) {
        this.batches.delete(batchId);
      }
    }
  }
}

// ── Singleton ───────────────────────────────────────────────────────────────

let queueInstance: TaskQueue | null = null;

export function getQueue(config?: Partial<QueueConfig>): TaskQueue {
  if (!queueInstance) {
    queueInstance = new TaskQueue(config);
  }
  return queueInstance;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Helper: estimate task count from input for common batch operations.
 * Useful for splitting multi-file inputs into individual tasks.
 */
export function estimateTaskCount(input: Record<string, unknown>): number {
  if (input.files && Array.isArray(input.files)) {
    return input.files.length;
  }
  return 1;
}
