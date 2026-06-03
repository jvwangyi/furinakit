import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync } from 'fs';
import { randomUUID } from 'crypto';

const TEMP_ROOT = join(tmpdir(), 'furinakit');

export function createTempDir(): string {
  const id = randomUUID();
  const dir = join(TEMP_ROOT, id);
  mkdirSync(dir, { recursive: true });
  setTimeout(() => cleanTempDir(dir), 5 * 60 * 1000);
  return dir;
}

export function cleanTempDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}
