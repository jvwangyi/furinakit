'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { Server, Database, Settings } from 'lucide-react';

interface SystemData {
  server: {
    uptime: number;
    platform: string;
    arch: string;
    nodeVersion: string;
    hostname: string;
    cpus: number;
    totalMemory: string;
    freeMemory: string;
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
  database: {
    url: string;
    size: string;
    records: { users: number; sessions: number; history: number; favorites: number };
  };
  environment: Record<string, string>;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

export default function AdminSystemPage() {
  const { t } = useI18n();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(withBasePath('/api/admin/system'))
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!data) return null;

  const { server, database, environment } = data;

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Server Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {t('admin.server_status')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <InfoRow label={t('admin.uptime')} value={formatUptime(server.uptime)} />
          <InfoRow label={t('admin.platform')} value={`${server.platform} (${server.arch})`} />
          <InfoRow label={t('admin.hostname')} value={server.hostname} />
          <InfoRow label={t('admin.node_version')} value={server.nodeVersion} />
          <InfoRow label={t('admin.cpu_count')} value={`${server.cpus} cores`} />
          <InfoRow label={t('admin.memory')} value={`${server.heapUsed} / ${server.heapTotal} (heap)`} />
          <InfoRow label="RSS" value={server.rss} />
          <InfoRow label="System Memory" value={`${server.freeMemory} free / ${server.totalMemory}`} />
        </CardContent>
      </Card>

      {/* Database Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('admin.db_info')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="URL" value={database.url} />
          <InfoRow label={t('admin.db_size')} value={database.size} />
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">{t('admin.db_records')}</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(database.records).map(([key, count]) => (
                <div key={key} className="flex justify-between p-2 bg-muted rounded">
                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                  <Badge variant="secondary">{count.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('admin.env_vars')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(environment).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Key</th>
                    <th className="pb-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(environment).map(([key, val]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-2 font-mono text-sm">{key}</td>
                      <td className="py-2 font-mono text-sm text-muted-foreground">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">No environment variables configured</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
