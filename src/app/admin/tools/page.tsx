'use client';

import { useState, useEffect } from 'react';
import { Wrench, Users as UsersIcon } from 'lucide-react';

interface Tool {
  name: string;
  usageCount: number;
  uniqueUsers: number;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/tools')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTools(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxUsage = tools.length > 0 ? Math.max(...tools.map((t) => t.usageCount), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">工具管理</h1>
        <p className="text-muted-foreground mt-1">所有工具的使用统计</p>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">工具名称</th>
                <th className="px-4 py-3 text-left font-medium">使用次数</th>
                <th className="px-4 py-3 text-left font-medium">独立用户</th>
                <th className="px-4 py-3 text-left font-medium">使用量</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    加载中...
                  </td>
                </tr>
              ) : tools.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              ) : (
                tools.map((tool) => (
                  <tr key={tool.name} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{tool.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{tool.usageCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {tool.uniqueUsers}
                      </div>
                    </td>
                    <td className="px-4 py-3 w-48">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${(tool.usageCount / maxUsage) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
