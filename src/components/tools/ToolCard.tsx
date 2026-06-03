'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Wrench
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { categoryKeys } from '@/lib/constants';

interface ToolCardProps {
  name: string;
  description: string;
  category: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
  text: <Type className="h-5 w-5" />,
  video: <Film className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  dev: <Code className="h-5 w-5" />,
  convert: <ArrowRightLeft className="h-5 w-5" />,
  file: <Folder className="h-5 w-5" />,
  craft: <Palette className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  pdf: 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20',
  image: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
  text: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
  video: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20',
  audio: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
  dev: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
  convert: 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/20',
  file: 'bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500/20',
  craft: 'bg-pink-500/10 text-pink-500 dark:text-pink-400 border-pink-500/20',
};

const categoryIconBg: Record<string, string> = {
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

export function ToolCard({ name, description, category }: ToolCardProps) {
  const { t } = useI18n();
  const icon = categoryIcons[category] || <Wrench className="h-5 w-5" />;
  const colorClass = categoryColors[category] || 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
  const iconBgClass = categoryIconBg[category] || 'bg-slate-500/10 text-slate-500 dark:text-slate-400';
  
  const displayName = t(`tool.${name}`) || name;
  const displayDesc = t(`tool.${name}.desc`) || description;
  
  return (
    <Link href={`/${category}/${name}`}>
      <Card className="h-full card-hover cursor-pointer group border border-border/40 bg-card hover:border-border/60 hover:-translate-y-0.5 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${iconBgClass} transition-transform duration-300 group-hover:scale-105`}>
              {icon}
            </div>
            <Badge variant="secondary" className={`${colorClass} border text-xs`}>
              {t(categoryKeys[category]) || category}
            </Badge>
          </div>
          <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors duration-200">
            {displayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2 text-muted-foreground/80">
            {displayDesc}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
