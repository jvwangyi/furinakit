// In-memory progress store for tracking long-running operations

interface ProgressEntry {
  id: string;
  toolName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  error: string | null;
}

const progressStore = new Map<string, ProgressEntry>();

export function createProgress(id: string, toolName: string): ProgressEntry {
  const entry: ProgressEntry = {
    id,
    toolName,
    status: 'pending',
    progress: 0,
    message: 'Queued',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };
  progressStore.set(id, entry);
  return entry;
}

export function updateProgress(id: string, progress: number, message: string): void {
  const entry = progressStore.get(id);
  if (entry) {
    entry.progress = Math.min(100, Math.max(0, progress));
    entry.message = message;
    entry.status = progress >= 100 ? 'completed' : 'processing';
    entry.updatedAt = new Date().toISOString();
    if (progress >= 100) {
      entry.completedAt = new Date().toISOString();
    }
  }
}

export function completeProgress(id: string): void {
  const entry = progressStore.get(id);
  if (entry) {
    entry.status = 'completed';
    entry.progress = 100;
    entry.message = 'Done';
    entry.completedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
  }
}

export function failProgress(id: string, error: string): void {
  const entry = progressStore.get(id);
  if (entry) {
    entry.status = 'failed';
    entry.error = error;
    entry.message = `Failed: ${error}`;
    entry.completedAt = new Date().toISOString();
    entry.updatedAt = new Date().toISOString();
  }
}

export function getProgress(id: string): ProgressEntry | null {
  return progressStore.get(id) || null;
}

export function getAllProgress(): ProgressEntry[] {
  return Array.from(progressStore.values()).sort((a, b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

// Cleanup old entries (> 1 hour)
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [id, entry] of progressStore.entries()) {
      if (new Date(entry.updatedAt).getTime() < cutoff) {
        progressStore.delete(id);
      }
    }
  }, 10 * 60 * 1000);
  // Don't keep process alive just for cleanup
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}
