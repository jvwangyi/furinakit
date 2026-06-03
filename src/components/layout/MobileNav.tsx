'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  FileText,
  Image,
  Type,
  Film,
  Code,
  Folder,
  Palette,
  Home,
  Menu,
  X,
  Volume2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

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
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="lg:hidden w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 safe-area-top w-full">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-label={open ? t('aria.close_menu') : t('aria.open_menu')}
            className="h-11 w-11"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <img src="/furinakit/furina.jpg" alt="FurinaKit" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-bold text-lg">FurinaKit</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher direction="down" />
          <ThemeToggle />
        </div>
      </div>

      {/* Side drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-[45px] z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <nav className="fixed top-[45px] left-0 bottom-0 z-50 w-36 bg-background border-r border-border shadow-xl p-4 space-y-1 safe-area-bottom overflow-y-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = pathname === category.href ||
                (category.href !== '/' && pathname.startsWith(category.href));

              return (
                <Link
                  key={category.name}
                  href={category.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px]",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(getCategoryKey(category.name))}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
