'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { Users, Trash2, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  usageCount: number;
  favoriteCount: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(withBasePath(`/api/admin/users?page=${page}&pageSize=20`))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUsers(d.data);
          setPagination(d.pagination);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  async function toggleBan(user: UserItem) {
    const isBanned = user.role === 'banned';
    const msg = isBanned ? t('admin.confirm_enable') : t('admin.confirm_disable');
    if (!confirm(msg)) return;

    await fetch(withBasePath('/api/admin/users'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, banned: !isBanned }),
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: isBanned ? 'user' : 'banned' } : u))
    );
  }

  async function deleteUser(user: UserItem) {
    if (!confirm(t('admin.confirm_delete'))) return;

    const res = await fetch(withBasePath('/api/admin/users'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    const d = await res.json();
    if (d.success) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('admin.user_list')}
          {pagination && <span className="text-sm font-normal text-muted-foreground">({pagination.total})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t('admin.user_name')}</th>
                    <th className="pb-2 font-medium">{t('admin.user_email')}</th>
                    <th className="pb-2 font-medium">{t('admin.user_role')}</th>
                    <th className="pb-2 font-medium text-right">{t('admin.user_usage')}</th>
                    <th className="pb-2 font-medium text-right">{t('admin.user_favorites')}</th>
                    <th className="pb-2 font-medium">{t('admin.user_created')}</th>
                    <th className="pb-2 font-medium text-right">{t('admin.user_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 font-medium">{u.name || '-'}</td>
                      <td className="py-2.5 text-muted-foreground max-w-[200px] truncate">{u.email || '-'}</td>
                      <td className="py-2.5">
                        <Badge variant={u.role === 'admin' ? 'default' : u.role === 'banned' ? 'destructive' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">{u.usageCount}</td>
                      <td className="py-2.5 text-right">{u.favoriteCount}</td>
                      <td className="py-2.5 text-muted-foreground whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleBan(u)}
                            title={u.role === 'banned' ? t('admin.enable') : t('admin.disable')}
                            className={u.role === 'banned' ? 'text-green-600' : 'text-amber-600'}
                          >
                            {u.role === 'banned' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteUser(u)}
                            title={t('admin.delete_user')}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  {t('admin.page_info').replace('{page}', String(pagination.page)).replace('{total}', String(pagination.totalPages))}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4 mr-1" />{t('admin.prev')}
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                    {t('admin.next')}<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">{t('admin.no_users')}</p>
        )}
      </CardContent>
    </Card>
  );
}
