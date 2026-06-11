'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { AuthButton } from '@/components/AuthButton';
import {
  Users,
  BarChart3,
  Wrench,
  Server,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

const navItems = [
  { key: 'stats', href: '/admin/stats', icon: BarChart3 },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'tools', href: '/admin/tools', icon: Wrench },
  { key: 'system', href: '/admin/system', icon: Server },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(withBasePath('/api/admin/stats'))
      .then((res) => {
        setIsAdmin(res.ok);
      })
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">{t('admin.no_permission')}</h1>
          <Link href="/" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {t('auth.back_home')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
        </div>
        <AuthButton />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`admin.${item.key}`)}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
