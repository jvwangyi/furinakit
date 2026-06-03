'use client';

import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface TermLabelProps {
  label: string;
  termKey?: string;
  t: (key: string) => string;
}

export function TermLabel({ label, termKey, t }: TermLabelProps) {
  if (!termKey) return <Label>{label}</Label>;
  const explanation = t(termKey);
  if (explanation === termKey) return <Label>{label}</Label>;
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{explanation}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
