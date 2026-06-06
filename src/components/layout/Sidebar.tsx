'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, apiPath } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import {
  FileText,
  Image,
  Type,
  Film,
  Code,
  Folder,
  Palette,
  Home,
  Volume2,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  Heart,
  Shield,
} from 'lucide-react';

const getCategoryKey = (name: string) => `nav.${name.toLowerCase()}`;

const categories = [
  { name: 'All', icon: Home, href: '/' },
  { name: 'PDF', icon: FileText, href: '/pdf' },
  { name: 'Image', icon: Image, href: '/image' },
  { name: 'Text', icon: Type, href: '/text' },
  { name: 'Video', icon: Film, href: '/video' },
  { name: 'Audio', icon: Volume2, href: '/audio' },
  { name: 'Convert', icon: RefreshCw, href: '/convert' },
  { name: 'Dev', icon: Code, href: '/dev' },
  { name: 'File', icon: Folder, href: '/file' },
  { name: 'Craft', icon: Palette, href: '/craft' },
  { name: 'Life', icon: Heart, href: '/life' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [toolCount, setToolCount] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') {
      setCollapsed(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  }, [collapsed, mounted]);

  const toggleCollapse = () => setCollapsed(prev => !prev);

  useEffect(() => {
    fetch(apiPath('/api/tools'))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setToolCount(data.data.length);
        } else {
          setFetchError(true);
        }
      })
      .catch(() => {
        setFetchError(true);
      });

    // Check admin status
    fetch(apiPath('/api/user/me'))
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const collapsedWidth = collapsed && mounted;

  return (
    <aside
      className={cn(
        "border-r border-sidebar-border bg-sidebar hidden lg:flex lg:flex-col transition-all duration-300 ease-in-out",
        collapsedWidth ? 'w-16' : 'w-56'
      )}
    >
      <div className="sticky top-0 flex flex-col h-screen overflow-hidden">
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          collapsedWidth ? 'justify-center px-3 py-4' : 'gap-3 px-6 py-5'
        )}>
          <Link href="/" className="flex items-center shrink-0">
            <img src={withBasePath("/furina.jpg")} alt="FurinaKit" className="h-10 w-10 rounded-xl object-cover ring-2 ring-sidebar-primary/30" />
          </Link>
          {!collapsedWidth && (
            <Link href="/" className="min-w-0">
              <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">FurinaKit</h1>
              <p className="text-[10px] text-sidebar-foreground/40 truncate">{t('site.title')}</p>
            </Link>
          )}
        </div>

        {/* Navigation */}
          <nav className={cn(
            "flex-1 overflow-y-auto py-4",
            collapsedWidth ? 'px-2 space-y-1' : 'px-3 space-y-1'
          )}>
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = pathname === category.href ||
                (category.href !== '/' && pathname.startsWith(category.href));

              return (
                <Link
                  key={category.name}
                  href={category.href}
                  title={collapsedWidth ? t(getCategoryKey(category.name)) : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                    collapsedWidth ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsedWidth && (
                    <span className="truncate">{t(getCategoryKey(category.name))}</span>
                  )}
                </Link>
              );
            })}
          </nav>

        {/* Admin link */}
        {isAdmin && (
          <div className={cn(
            "border-t border-sidebar-border",
            collapsedWidth ? 'px-2 py-2' : 'px-3 py-2'
          )}>
            <Link
              href="/admin"
              title={collapsedWidth ? t('nav.admin') : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                collapsedWidth ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                pathname.startsWith('/admin')
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              {!collapsedWidth && <span className="truncate">{t('nav.admin')}</span>}
            </Link>
          </div>
        )}

        {/* Bottom controls */}
        <div className="mt-auto">
          {/* Language & Theme */}
          <div className={cn(
            "flex items-center border-t border-sidebar-border transition-all duration-300",
            collapsedWidth ? 'flex-col gap-1 px-2 py-3' : 'gap-2 px-3 py-2'
          )}>
            <LanguageSwitcher direction="up" />
            <ThemeToggle />
          </div>

          {/* Version info */}
          {!collapsedWidth && (
            <div className="px-6 py-3 border-t border-sidebar-border">
              <p className="text-xs text-sidebar-foreground/40">
                FurinaKit v0.1.0
              </p>
              <p className="text-xs text-sidebar-foreground/40 mt-1">
                {fetchError
                  ? t('sidebar.tools_error') || 'Unable to load tools'
                  : toolCount !== null
                    ? `${toolCount} ${t('sidebar.tools_available')}`
                    : '...'}
              </p>
            </div>
          )}

          {/* Collapse toggle button */}
          <button
            onClick={toggleCollapse}
            className={cn(
              "flex items-center w-full border-t border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
              collapsedWidth ? 'justify-center py-3' : 'gap-3 px-6 py-3'
            )}
            aria-label={collapsed ? t('sidebar.expand') || 'Expand sidebar' : t('sidebar.collapse') || 'Collapse sidebar'}
          >
            {collapsedWidth ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-sm">{t('sidebar.collapse') || 'Collapse'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
