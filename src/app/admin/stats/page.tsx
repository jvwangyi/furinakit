'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { BarChart3, Users, Activity, TrendingUp, Star } from 'lucide-react';

interface StatsData {
  overview: {
    totalUsers: number;
    totalToolUsage: number;
    toolUsageToday: number;
    todayActiveUsers: number;
    totalFavorites: number;
  };
  topTools: { toolName: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  recentUsers: { id: string; name: string | null; email: string | null; role: string; createdAt: string }[];
}

export default function AdminStatsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(withBasePath('/api/admin/stats'))
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!data) return null;

  const { overview, topTools, dailyTrend, recentUsers } = data;
  const maxDaily = Math.max(...dailyTrend.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.total_users')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{overview.totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.total_usage')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{overview.totalToolUsage}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.today_active')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{overview.todayActiveUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.today_usage')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{overview.toolUsageToday}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('admin.total_favorites')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{overview.totalFavorites}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Tools */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{t('admin.hot_tools')}</CardTitle></CardHeader>
          <CardContent>
            {topTools.length > 0 ? (
              <div className="space-y-3">
                {topTools.map((tool, i) => (
                  <div key={tool.toolName} className="flex items-center gap-3">
                    <Badge variant={i < 3 ? 'default' : 'secondary'} className="w-6 h-6 flex items-center justify-center p-0">{i + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{t(`tool.${tool.toolName}`) || tool.toolName}</div>
                      <div className="text-xs text-muted-foreground">{tool.count} {t('dashboard.requests')}</div>
                    </div>
                    <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${(tool.count / topTools[0].count) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">{t('dashboard.no_data')}</p>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />{t('admin.daily_trend')}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-px h-40">
              {dailyTrend.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div
                    className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all hover:bg-primary"
                    style={{ height: `${(d.count / maxDaily) * 100}%` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {d.date.slice(5)}: {d.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{dailyTrend[0]?.date.slice(5)}</span>
              <span>{dailyTrend[dailyTrend.length - 1]?.date.slice(5)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{t('admin.recent_users')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">{t('admin.user_name')}</th>
                  <th className="pb-2 font-medium">{t('admin.user_email')}</th>
                  <th className="pb-2 font-medium">{t('admin.user_role')}</th>
                  <th className="pb-2 font-medium">{t('admin.user_created')}</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.name || '-'}</td>
                    <td className="py-2 text-muted-foreground">{u.email || '-'}</td>
                    <td className="py-2">
                      <Badge variant={u.role === 'admin' ? 'default' : u.role === 'banned' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
