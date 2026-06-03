'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { categoryKeys } from '@/lib/constants';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { t } = useI18n();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-6 overflow-x-auto scrollbar-none">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors min-h-[44px] px-1.5 rounded-md hover:bg-muted/50 flex-shrink-0"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('breadcrumb.home')}</span>
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors min-h-[44px] flex items-center px-1.5 rounded-md hover:bg-muted/50 max-w-[160px] sm:max-w-none truncate"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium px-1.5 max-w-[160px] sm:max-w-none truncate">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

/** Helper to build breadcrumb items from category and tool name */
export function useToolBreadcrumb(category: string, toolName: string, toolDisplayName?: string) {
  const { t } = useI18n();

  const categoryLabel = t(categoryKeys[category]) || category;
  const toolLabel = toolDisplayName || t(`tool.${toolName}`) || toolName;

  return [
    { label: categoryLabel, href: `/${category}` },
    { label: toolLabel },
  ];
}
