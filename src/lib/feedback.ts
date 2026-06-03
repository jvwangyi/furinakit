import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface Feedback {
  id: string;
  toolName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readFeedbacks(): Promise<Feedback[]> {
  try {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeFeedbacks(feedbacks: Feedback[]) {
  await ensureDataDir();
  await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), 'utf-8');
}

export async function addFeedback(input: {
  toolName: string;
  rating: number;
  comment?: string;
}): Promise<Feedback> {
  const feedback: Feedback = {
    id: randomUUID(),
    toolName: input.toolName,
    rating: Math.max(1, Math.min(5, Math.round(input.rating))) as Feedback['rating'],
    comment: input.comment?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const feedbacks = await readFeedbacks();
  feedbacks.push(feedback);
  await writeFeedbacks(feedbacks);

  return feedback;
}

export async function getFeedbacks(toolName?: string): Promise<Feedback[]> {
  const feedbacks = await readFeedbacks();
  if (toolName) {
    return feedbacks.filter((f) => f.toolName === toolName);
  }
  return feedbacks;
}
