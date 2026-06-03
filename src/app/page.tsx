'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToolCard } from '@/components/tools/ToolCard';
import { RecentTools } from '@/components/tools/RecentTools';
import { Search } from 'lucide-react';
import { apiPath } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { categoryKeys } from '@/lib/constants';
import { withBasePath } from '@/lib/basePath';
import type { ToolInfo } from '@/types/tool';

export default function HomePage() {
  const { t } = useI18n();
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // `/` to focus search (when not in an input/textarea)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // ESC to blur search
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    fetch(apiPath('/api/tools'))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTools(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTools = tools.filter(tool => {
    const matchesSearch = !search ||
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !selectedCategory || tool.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (!selectedCategory) {
      const catOrder = ['pdf', 'image', 'text', 'dev', 'convert', 'audio', 'video', 'file', 'craft'];
      const aIdx = catOrder.indexOf(a.category);
      const bIdx = catOrder.indexOf(b.category);
      if (aIdx !== bIdx) return aIdx - bIdx;
    }
    return a.name.localeCompare(b.name);
  });

  const categories = Array.from(new Set(tools.map(t => t.category)));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative p-4 sm:p-6 lg:p-8 pb-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <img src={withBasePath("/furina.jpg")} alt="FurinaKit" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-primary/20 shadow-lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">FurinaKit</h1>
              <p className="text-sm text-muted-foreground">{t('site.subtitle')}</p>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mt-2 text-sm sm:text-base">
            {t('site.description')}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Recent Tools */}
        <RecentTools />

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder={t('search.placeholder.shortcut')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={() => setSelectedCategory(null)}
          >
            {t('nav.all')}
          </Badge>
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              {t(categoryKeys[category]) || category}
            </Badge>
          ))}
        </div>

        {/* Tools Grid */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p>{t('tools.loading')}</p>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-1">{t('tools.empty')}</p>
            <p className="text-sm">{t('tools.empty.desc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {filteredTools.map(tool => (
              <ToolCard
                key={tool.name}
                name={tool.name}
                description={tool.description}
                category={tool.category}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
