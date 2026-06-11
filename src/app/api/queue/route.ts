/**
 * Queue API — batch task submission and status monitoring.
 *
 * POST /api/queue   — Submit a batch of tasks
 * GET  /api/queue   — Overall queue status or batch progress (with ?batchId=...)
 */

import { NextRequest } from 'next/server';
import { getQueue, type TaskDefinition } from '@/lib/queue';
import { getTool } from '@/lib/registry';
import { errorResponse, ToolError, ErrorCode } from '@/lib/errors';

// ── POST — Submit batch ─────────────────────────────────────────────────────

interface BatchRequest {
  /** Array of tasks to enqueue */
  tasks: Array<{
    /** Tool name (e.g. 'pdf-merge', 'image-compress') */
    toolName: string;
    /** Input for tool.execute() — must match the tool's schema */
    input: Record<string, unknown>;
    /** Optional human-readable label */
    label?: string;
    /** Optional priority (default: 'normal') */
    priority?: 'low' | 'normal' | 'high';
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BatchRequest;

    if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'tasks array is required and must not be empty');
    }

    if (body.tasks.length > 50) {
      throw new ToolError(ErrorCode.INVALID_INPUT, 'Maximum 50 tasks per batch');
    }

    // Validate that all referenced tools exist
    const taskDefs: TaskDefinition[] = body.tasks.map((t, i) => {
      const tool = getTool(t.toolName);
      if (!tool) {
        throw new ToolError(
          ErrorCode.TOOL_NOT_FOUND,
          `Task[${i}]: tool "${t.toolName}" not found`
        );
      }
      return {
        toolName: t.toolName,
        input: t.input,
        label: t.label || tool.description || t.toolName,
        priority: t.priority || 'normal',
      };
    });

    const queue = getQueue();
    const { batchId, taskIds } = queue.enqueueBatch(taskDefs);

    return Response.json({
      success: true,
      data: {
        batchId,
        taskCount: taskIds.length,
        taskIds,
        statusUrl: `/api/queue?batchId=${batchId}`,
      },
    });
  } catch (error) {
    return errorResponse(error as Error);
  }
}

// ── GET — Queue status or batch progress ─────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');
    const taskId = searchParams.get('taskId');

    const queue = getQueue();

    // Batch progress
    if (batchId) {
      const progress = queue.getBatchProgress(batchId);
      if (!progress) {
        return Response.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } },
          { status: 404 }
        );
      }
      return Response.json({ success: true, data: progress });
    }

    // Single task detail
    if (taskId) {
      const task = queue.getTask(taskId);
      if (!task) {
        return Response.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } },
          { status: 404 }
        );
      }
      return Response.json({
        success: true,
        data: {
          id: task.id,
          batchId: task.batchId,
          toolName: task.toolName,
          label: task.label,
          status: task.status,
          progress: task.progress,
          error: task.error,
          enqueuedAt: task.enqueuedAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
        },
      });
    }

    // Overall status
    const status = queue.getStatus();
    return Response.json({ success: true, data: status });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
