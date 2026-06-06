'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Star,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { ToolInfo } from '@/types/tool';

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

interface FavoritesSectionProps {
  favorites: string[];
  tools: ToolInfo[];
  onRemove: (name: string) => void;
}

export function FavoritesSection({ favorites, tools, onRemove }: FavoritesSectionProps) {
  const { t } = useI18n();

  if (favorites.length === 0) return null;

  const favoriteTools = favorites
    .map(name => tools.find(tool => tool.name === name))
    .filter((tool): tool is ToolInfo => tool !== undefined);

  if (favoriteTools.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
        <h2 className="text-lg font-semibold">{t('favorites.title')}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {favoriteTools.map(tool => {
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(tool.name);
                      }}
                      className="p-1 rounded-md hover:bg-amber-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title={t('favorites.remove')}
                    >
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </button>
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
