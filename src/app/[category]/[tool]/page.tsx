'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiPath } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useToolBreadcrumb } from '@/components/layout/Breadcrumb';
import { ToolPageContainer } from '@/components/tools/ToolPageContainer';
import { PerlerBeadsClient } from './perler-client';
import type { ToolInfo } from '@/types/tool';

export default function ToolPage() {
  const { t, tError } = useI18n();
  const params = useParams();
  const category = params.category as string;
  const toolName = params.tool as string;

  const [tool, setTool] = useState<ToolInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const breadcrumbItems = useToolBreadcrumb(category, toolName, t(`tool.${toolName}`) || tool?.name);

  useEffect(() => {
    fetch(apiPath('/api/tools'))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const found = data.data.find((t: ToolInfo) => t.name === toolName);
          setTool(found || null);
        }
      })
      .finally(() => setLoading(false));
  }, [toolName]);

  // PerlerBeads has its own client component
  if (toolName === 'perler-beads') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <PerlerBeadsClient />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center text-muted-foreground">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
        <p className="text-sm">{t('tools.loading')}</p>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center text-muted-foreground">
        <p className="text-lg">{t('tool.not_found')}</p>
      </div>
    );
  }

  return (
    <ToolPageContainer
      category={category}
      toolName={toolName}
      t={t}
      tError={tError}
      breadcrumbItems={breadcrumbItems}
      tool={tool}
    />
  );
}
