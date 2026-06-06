'use client';

import { useState, useEffect } from 'react';
import { Users, Wrench, Activity, TrendingUp } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalUsage: number;
  todayActive: number;
  topTools: { name: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
        else setError(data.error || '加载失败');
      })
      .catch(() => setError('网络错误'));
  }, []);

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const cards = [
    { label: '总用户数', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: '总使用次数', value: stats.totalUsage, icon: Activity, color: 'text-green-500' },
    { label: '今日活跃', value: stats.todayActive, icon: TrendingUp, color: 'text-orange-500' },
    { label: '工具数', value: stats.topTools.length, icon: Wrench, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">数据总览</h1>
        <p className="text-muted-foreground mt-1">系统运行概况</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="border rounded-xl p-5 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold mt-2">{card.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Top Tools */}
      <div className="border rounded-xl bg-card p-5">
        <h2 className="text-lg font-semibold mb-4">热门工具 Top 10</h2>
        {stats.topTools.length === 0 ? (
          <p className="text-muted-foreground">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {stats.topTools.map((tool, i) => (
              <div key={tool.name} className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground w-6">#{i + 1}</span>
                <span className="flex-1 text-sm">{tool.name}</span>
                <span className="text-sm font-medium">{tool.count} 次</span>
                <div className="w-32 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${(tool.count / stats.topTools[0].count) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Trend */}
      <div className="border rounded-xl bg-card p-5">
        <h2 className="text-lg font-semibold mb-4">近 7 天使用趋势</h2>
        {stats.dailyTrend.length === 0 ? (
          <p className="text-muted-foreground">暂无数据</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {stats.dailyTrend.map((day) => {
              const maxCount = Math.max(...stats.dailyTrend.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{day.count}</span>
                  <div
                    className="w-full bg-primary/20 rounded-t-md relative"
                    style={{ height: `${height}%`, minHeight: 4 }}
                  >
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-md" style={{ height: '100%' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
