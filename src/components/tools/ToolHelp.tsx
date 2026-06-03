'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ToolHelpProps {
  toolName: string;
}

export function ToolHelp({ toolName }: ToolHelpProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const helpKey = `tool.${toolName}.help`;
  const helpText = t(helpKey);

  // 如果没有帮助文本，不渲染
  if (helpText === helpKey) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="gap-1.5" />}>
        <HelpCircle className="h-4 w-4" />
        {t('tool.help')}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(`tool.${toolName}`)}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground whitespace-pre-line">
          {helpText}
        </div>
      </DialogContent>
    </Dialog>
  );
}
