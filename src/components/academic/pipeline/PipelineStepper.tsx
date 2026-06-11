'use client';

import { useI18n } from '@/lib/i18n';
import { STAGE_ORDER, STAGE_CONFIG, stageStatus, type Stage } from '@/lib/academic/pipeline';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Users,
  Pencil,
  Download,
  Check,
  Lock,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
  BarChart3,
  Lightbulb,
  Calculator,
  BarChart,
  Wand2,
  Presentation,
  PenLine,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Users,
  Pencil,
  Download,
  RefreshCw,
  ShieldAlert,
  BarChart3,
  Calculator,
  BarChart,
  Wand2,
  Presentation,
  PenLine,
};

interface PipelineStepperProps {
  currentStage: string;
  onStageClick: (stage: Stage) => void;
}

export function PipelineStepper({ currentStage, onStageClick }: PipelineStepperProps) {
  const { t } = useI18n();

  return (
    <div className="w-full overflow-x-auto pb-2 sidebar-scroll">
      <div className="flex items-center gap-1 min-w-max">
        {STAGE_ORDER.map((stage, i) => {
          const status = stageStatus(currentStage, stage);
          const config = STAGE_CONFIG[stage];
          const Icon = ICON_MAP[config.icon] || BookOpen;
          const isClickable = status !== 'locked';

          return (
            <div key={stage} className="flex items-center">
              <button
                onClick={() => onStageClick(stage)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                  status === 'completed' && 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20',
                  status === 'current' && 'bg-primary text-primary-foreground shadow-sm cursor-pointer',
                  status === 'accessible' && 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25 cursor-pointer',
                  status === 'locked' && 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed',
                )}
              >
                {status === 'completed' ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="hidden sm:inline">{t(config.label)}</span>
              </button>
              {i < STAGE_ORDER.length - 1 && (
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 mx-0.5 shrink-0',
                    status === 'completed' ? 'text-green-500/50' : status === 'current' ? 'text-yellow-500/50' : 'text-muted-foreground/30',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
