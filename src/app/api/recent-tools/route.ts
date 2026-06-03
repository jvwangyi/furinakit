import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface RecentTool {
  name: string;
  category: string;
  timestamp: number;
}

interface RecentToolsData {
  [uid: string]: RecentTool[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'recent-tools.json');
const MAX_RECENT = 20;
const COOKIE_NAME = 'furinaki-uid';
const COOKIE_OPTIONS = 'Path=/furinakit; Max-Age=31536000; SameSite=Lax';

// Simple mutex to prevent concurrent writes
let writeLock: Promise<void> = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readData(): Promise<RecentToolsData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeData(data: RecentToolsData): Promise<void> {
  // Chain writes to prevent concurrent corruption
  writeLock = writeLock.then(async () => {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  });
  await writeLock;
}

function getOrCreateUid(req: NextRequest): { uid: string; isNew: boolean } {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing) return { uid: existing, isNew: false };
  return { uid: crypto.randomUUID(), isNew: true };
}

export async function GET(req: NextRequest) {
  try {
    const { uid } = getOrCreateUid(req);
    const data = await readData();
    const tools = data[uid] || [];
    return NextResponse.json({ success: true, data: tools });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'name is required' } },
        { status: 400 }
      );
    }
    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'category is required' } },
        { status: 400 }
      );
    }

    const { uid, isNew } = getOrCreateUid(req);
    const data = await readData();
    const existing = data[uid] || [];

    // Remove duplicate, add to front, keep max
    const filtered = existing.filter((t) => t.name !== name);
    filtered.unshift({ name, category, timestamp: Date.now() });
    data[uid] = filtered.slice(0, MAX_RECENT);

    await writeData(data);

    const res = NextResponse.json({ success: true });
    if (isNew) {
      res.cookies.set(COOKIE_NAME, uid, {
        path: '/furinakit',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    }
    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: (error as Error).message } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { uid } = getOrCreateUid(req);
    const data = await readData();
    delete data[uid];
    await writeData(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: (error as Error).message } },
      { status: 500 }
    );
  }
}
