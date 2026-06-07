'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/components/ThemeProvider';
import { withBasePath } from '@/lib/basePath';
import { BarChart3, Users, Activity, TrendingUp, Star } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

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
  const { resolved } = useTheme();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(withBasePath('/api/admin/stats'))
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isDark = resolved === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  const primaryColor = isDark ? 'hsl(262, 80%, 65%)' : 'hsl(262, 80%, 50%)';
  const primaryBg = isDark ? 'hsla(262, 80%, 65%, 0.15)' : 'hsla(262, 80%, 50%, 0.1)';

  // Prepare chart data
  const dailyChartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.dailyTrend.map((d) => d.date.slice(5)),
      datasets: [
        {
          label: t('admin.chart_usage_count'),
          data: data.dailyTrend.map((d) => d.count),
          borderColor: primaryColor,
          backgroundColor: primaryBg,
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: primaryColor,
          borderWidth: 2,
        },
      ],
    };
  }, [data, primaryColor, primaryBg, t]);

  const dailyChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' as const },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'hsl(240, 10%, 15%)' : 'hsl(0, 0%, 100%)',
          titleColor: isDark ? '#fff' : '#111',
          bodyColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, maxRotation: 0, autoSkipPadding: 12, font: { size: 11 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
          beginAtZero: true,
        },
      },
    }),
    [isDark, gridColor, textColor],
  );

  const barChartData = useMemo(() => {
    if (!data || data.topTools.length === 0) return null;
    const colors = data.topTools.map((_, i) =>
      i === 0 ? primaryColor : isDark ? `hsla(262, 80%, 65%, ${0.85 - i * 0.07})` : `hsla(262, 80%, 50%, ${0.85 - i * 0.07})`,
    );
    return {
      labels: data.topTools.map((t) => t.toolName),
      datasets: [
        {
          label: t('admin.chart_usage_count'),
          data: data.topTools.map((t) => t.count),
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [data, primaryColor, isDark, t]);

  const barChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'hsl(240, 10%, 15%)' : 'hsl(0, 0%, 100%)',
          titleColor: isDark ? '#fff' : '#111',
          bodyColor: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
          beginAtZero: true,
        },
        y: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 11 } },
        },
      },
    }),
    [isDark, gridColor, textColor],
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!data) return null;

  const { overview, dailyTrend, recentUsers } = data;

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('admin.chart_daily_trend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyChartData && dailyTrend.length > 0 ? (
              <div className="h-64">
                <Line data={dailyChartData} options={dailyChartOptions} />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">{t('dashboard.no_data')}</p>
            )}
          </CardContent>
        </Card>

        {/* Top Tools Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('admin.chart_top_tools')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData && data.topTools.length > 0 ? (
              <div className="h-64">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">{t('dashboard.no_data')}</p>
            )}
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
