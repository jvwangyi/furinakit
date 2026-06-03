import { promises as fs } from 'fs';
import path from 'path';

export interface ToolUsage {
  toolName: string;
  count: number;
  lastUsed: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// Simple mutex to prevent concurrent writes
let writeLock: Promise<void> = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStats(): Promise<ToolUsage[]> {
  try {
    const data = await fs.readFile(STATS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeStats(stats: ToolUsage[]) {
  writeLock = writeLock.then(async () => {
    await ensureDataDir();
    await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  });
  await writeLock;
}

export async function recordToolUsage(toolName: string): Promise<ToolUsage> {
  const stats = await readStats();
  const existing = stats.find((s) => s.toolName === toolName);

  if (existing) {
    existing.count += 1;
    existing.lastUsed = new Date().toISOString();
  } else {
    stats.push({
      toolName,
      count: 1,
      lastUsed: new Date().toISOString(),
    });
  }

  await writeStats(stats);
  return stats.find((s) => s.toolName === toolName)!;
}

export async function getStats(limit?: number): Promise<ToolUsage[]> {
  const stats = await readStats();
  // Sort by count descending
  stats.sort((a, b) => b.count - a.count);
  if (limit) {
    return stats.slice(0, limit);
  }
  return stats;
}
