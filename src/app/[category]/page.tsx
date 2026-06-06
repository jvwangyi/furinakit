'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ToolCard } from '@/components/tools/ToolCard';
import { Search } from 'lucide-react';
import { apiPath } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useFavorites } from '@/lib/hooks/useFavorites';
import type { ToolInfo } from '@/types/tool';
import { categoryKeys } from '@/lib/constants';

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  const { t } = useI18n();
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetch(apiPath('/api/tools'))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTools(data.data.filter((t: ToolInfo) => t.category === category));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const filteredTools = tools.filter(tool =>
    !search ||
    tool.name.toLowerCase().includes(search.toLowerCase()) ||
    tool.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{t(categoryKeys[category]) || category}</h1>
        <p className="text-muted-foreground mb-6">{filteredTools.length} {t('tools.count')}</p>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search.placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-colors"
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
            <p>{t('tools.loading')}</p>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {tools.length === 0 ? (
              <>
                <p className="text-4xl mb-4">🚧</p>
                <p className="text-lg mb-1">{t('tools.coming_soon') || 'Coming Soon'}</p>
                <p className="text-sm">{t('tools.coming_soon.desc') || 'Tools for this category are under development. Stay tuned!'}</p>
              </>
            ) : (
              <>
                <p className="text-lg mb-1">{t('tools.empty')}</p>
                <p className="text-sm">{t('tools.empty.desc')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {filteredTools.map(tool => (
              <ToolCard
                key={tool.name}
                name={tool.name}
                description={tool.description}
                category={tool.category}
                isFavorite={isFavorite(tool.name)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
