'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { Wrench } from 'lucide-react';

interface ToolItem {
  name: string;
  usageCount: number;
  uniqueUsers: number;
}

export default function AdminToolsPage() {
  const { t } = useI18n();
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(withBasePath('/api/admin/tools'))
      .then((r) => r.json())
      .then((d) => { if (d.success) setTools(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {t('admin.tool_list')}
          <span className="text-sm font-normal text-muted-foreground">({tools.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tools.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">{t('admin.tool_name')}</th>
                  <th className="pb-2 font-medium text-right">{t('admin.tool_usage')}</th>
                  <th className="pb-2 font-medium text-right">{t('admin.tool_users')}</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool, i) => (
                  <tr key={tool.name} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 text-muted-foreground w-8">{i + 1}</td>
                    <td className="py-2.5 font-medium">{t(`tool.${tool.name}`) || tool.name}</td>
                    <td className="py-2.5 text-right">
                      <span className="font-mono">{tool.usageCount.toLocaleString()}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="font-mono">{tool.uniqueUsers}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">{t('dashboard.no_data')}</p>
        )}
      </CardContent>
    </Card>
  );
}
