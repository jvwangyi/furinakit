/**
 * Queue executor — bridges the task queue with the existing tool registry.
 *
 * Import this module once at app startup to register the executor:
 *   import '@/lib/queue-executor';
 */

import { getQueue } from './queue';
import { getTool } from './registry';
import { withCategoryTimeout } from './file-security';
import { recordToolUsage } from './tool-stats';

// Register the executor that runs tools through the existing pipeline
const queue = getQueue();

queue.setExecutor(async (toolName: string, input: Record<string, unknown>) => {
  const tool = getTool(toolName);
  if (!tool) throw new Error(`Tool "${toolName}" not found`);

  // Apply the same timeout as normal API routes
  const category = tool.category || 'default';
  const result = await withCategoryTimeout(tool.execute(input), category);

  // Record usage stats
  recordToolUsage(toolName);

  return result;
});
