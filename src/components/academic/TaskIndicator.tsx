'use client';

import { useTaskManager, type Task } from '@/lib/academic/TaskManager';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Trash2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface TaskIndicatorProps {
  stage: string;
  onTaskResult?: (task: Task) => void;
  hideCancel?: boolean;
}

function TaskItem({ task, onCancel, hideCancel }: { task: Task; onCancel: (id: string) => void; hideCancel?: boolean }) {
  const { t } = useI18n();

  const statusIcon = {
    pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
    running: <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />,
    failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
    cancelled: <X className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  const statusLabel = {
    pending: t('academic.task.status.pending'),
    running: t('academic.task.status.running'),
    completed: t('academic.task.status.completed'),
    failed: t('academic.task.status.failed'),
    cancelled: t('academic.task.status.cancelled'),
  };

  const statusBadgeVariant = {
    pending: 'secondary' as const,
    running: 'default' as const,
    completed: 'outline' as const,
    failed: 'destructive' as const,
    cancelled: 'secondary' as const,
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex-shrink-0">{statusIcon[task.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium truncate">
            {t(`academic.task.type.${task.type}`) || task.type}
          </span>
          <Badge variant={statusBadgeVariant[task.status]} className="text-[10px] px-1.5 py-0">
            {statusLabel[task.status]}
          </Badge>
        </div>
        {task.status === 'running' && (
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}
        {task.status === 'failed' && task.error && (
          <p className="text-[10px] text-destructive truncate mt-0.5">{task.error}</p>
        )}
        {task.status === 'completed' && task.completedAt && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {new Date(task.completedAt).toLocaleTimeString()}
          </p>
        )}
      </div>
      {!hideCancel && (task.status === 'running' || task.status === 'pending') && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={() => onCancel(task.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function TaskIndicator({ stage, onTaskResult, hideCancel }: TaskIndicatorProps) {
  const { t } = useI18n();
  const { getStageTasks, cancelTask, clearCompleted } = useTaskManager();
  const stageTasks = getStageTasks(stage);

  if (stageTasks.length === 0) return null;

  const activeTasks = stageTasks.filter(t => t.status === 'running' || t.status === 'pending');
  const completedTasks = stageTasks.filter(t => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled');

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('academic.task.background_tasks')}
            </CardTitle>
            {activeTasks.length > 0 && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                {activeTasks.length} {t('academic.task.active')}
              </Badge>
            )}
          </div>
          {completedTasks.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-muted-foreground"
              onClick={() => clearCompleted(stage)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {t('academic.task.clear_completed')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pb-3">
        {stageTasks.map(task => (
          <TaskItem key={task.id} task={task} onCancel={cancelTask} hideCancel={hideCancel} />
        ))}
      </CardContent>
    </Card>
  );
}
