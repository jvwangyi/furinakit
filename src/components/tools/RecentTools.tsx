'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Image,
  Type,
  Film,
  Music,
  Code,
  ArrowRightLeft,
  Folder,
  Palette,
  Wrench,
  Clock,
  Trash2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';

interface RecentTool {
  name: string;
  category: string;
  timestamp: number;
}

const MAX_RECENT = 8;

const categoryIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  video: <Film className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  dev: <Code className="h-4 w-4" />,
  convert: <ArrowRightLeft className="h-4 w-4" />,
  file: <Folder className="h-4 w-4" />,
  craft: <Palette className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-500 dark:text-red-400',
  image: 'bg-blue-500/10 text-blue-500 dark:text-blue-400',
  text: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400',
  video: 'bg-purple-500/10 text-purple-500 dark:text-purple-400',
  audio: 'bg-amber-500/10 text-amber-500 dark:text-amber-400',
  dev: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  convert: 'bg-orange-500/10 text-orange-500 dark:text-orange-400',
  file: 'bg-teal-500/10 text-teal-500 dark:text-teal-400',
  craft: 'bg-pink-500/10 text-pink-500 dark:text-pink-400',
};

const API_URL = apiPath('/api/recent-tools');

/** Add a tool to recent history (call from tool pages) */
export function trackToolUsage(name: string, category: string) {
  if (typeof window === 'undefined') return;
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category }),
  }).catch(() => {
    // Silently fail — don't break the UI
  });
}

export function RecentTools() {
  const { t } = useI18n();
  const [recentTools, setRecentTools] = useState<RecentTool[]>([]);

  const fetchRecentTools = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRecentTools(json.data.slice(0, MAX_RECENT));
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchRecentTools();

    const handleFocus = () => fetchRecentTools();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const clearHistory = async () => {
    try {
      await fetch(API_URL, { method: 'DELETE' });
      setRecentTools([]);
    } catch {
      // Silently fail
    }
  };

  if (recentTools.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t('recent.title')}</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="text-muted-foreground hover:text-foreground min-h-[44px]"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          {t('recent.clear')}
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {recentTools.map((tool) => {
          const icon = categoryIcons[tool.category] || <Wrench className="h-4 w-4" />;
          const colorClass = categoryColors[tool.category] || 'bg-slate-500/10 text-slate-500 dark:text-slate-400';
          const displayName = t(`tool.${tool.name}`) || tool.name;

          return (
            <Link key={tool.name} href={`/${tool.category}/${tool.name}`}>
              <Card className="hover:shadow-md hover:shadow-primary/10 transition-all duration-300 ease-out cursor-pointer group border border-border/40 hover:border-primary/25 bg-card hover:-translate-y-0.5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                        {displayName}
                      </p>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {tool.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
