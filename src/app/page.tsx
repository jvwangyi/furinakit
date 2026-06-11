'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolCard } from '@/components/tools/ToolCard';
import { RecentTools } from '@/components/tools/RecentTools';
import { FavoritesSection } from '@/components/tools/FavoritesSection';
import {
  Wrench,
  GraduationCap,
  BookOpen,
  PenLine,
  MessageSquareText,
  FolderKanban,
  ArrowRight,
  FileText,
  Image,
  Type,
  Film,
  Volume2,
  Code,
  Sparkles,
} from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import { apiPath } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { useFavorites } from '@/lib/hooks/useFavorites';
import type { ToolInfo } from '@/types/tool';

const quickTools = [
  { name: 'pdf-merge', icon: FileText, href: '/pdf/pdf-merge' },
  { name: 'image-compress', icon: Image, href: '/image/image-compress' },
  { name: 'json-format', icon: Type, href: '/text/json-format' },
  { name: 'video-compress', icon: Film, href: '/video/video-compress' },
  { name: 'audio-convert', icon: Volume2, href: '/audio/audio-convert' },
  { name: 'qrcode-gen', icon: Code, href: '/dev/qrcode-gen' },
];

const academicFeatures = [
  { key: 'literature', icon: BookOpen, href: '/academic/literature' },
  { key: 'writing', icon: PenLine, href: '/academic/writing' },
  { key: 'review', icon: MessageSquareText, href: '/academic/review' },
  { key: 'projects', icon: FolderKanban, href: '/academic/projects' },
];

const getToolName = (name: string, t: (key: string) => string) => {
  const translated = t(`tool.${name}`);
  return translated === `tool.${name}` ? name : translated;
};

export default function HomePage() {
  const { t } = useI18n();
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolCount, setToolCount] = useState<number>(0);
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetch(apiPath('/api/tools'))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTools(data.data);
          setToolCount(data.data.length);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative p-4 sm:p-6 lg:p-8 pb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <img src={withBasePath("/furina.jpg")} alt="FurinaKit" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-balance">FurinaKit</h1>
                <p className="text-sm text-muted-foreground">{t('site.subtitle')}</p>
              </div>
            </div>
            <AuthButton />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8">

        {/* ===== Module Cards ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-auto">
          {/* Tools */}
          <Link href="/tools" className="group">
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="relative pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t('nav.tools_section')}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{toolCount} {t('sidebar.tools_available')}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm mb-4">{t('site.description')}</CardDescription>
                <div className="flex flex-wrap gap-2">
                  {quickTools.slice(0, 4).map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                        <Icon className="h-3 w-3" />
                        <span>{getToolName(item.name, t)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Academic */}
          <Link href="/academic" className="group">
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <CardHeader className="relative pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t('nav.academic_section')}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('academic.home.description')}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm mb-4">{t('academic.literature.description')}</CardDescription>
                <div className="flex flex-wrap gap-2">
                  {academicFeatures.map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                        <Icon className="h-3 w-3" />
                        <span>{t(`nav.${item.key}`)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ===== Quick Tools ===== */}
        <div className="mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('tools.popular') || 'Quick Tools'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {quickTools.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className="group">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-medium text-center">{getToolName(item.name, t)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ===== Academic Features ===== */}
        <div className="mx-auto">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {t('nav.academic_section')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {academicFeatures.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.key} href={item.href} className="group">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs font-medium text-center">{t(`nav.${item.key}`)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ===== Recent & Favorites ===== */}
        <RecentTools />
        <FavoritesSection favorites={favorites} tools={tools} onRemove={toggleFavorite} />
      </div>
    </div>
  );
}
