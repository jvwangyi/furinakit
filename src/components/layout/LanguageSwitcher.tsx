'use client';

import { useState, useRef, useCallback } from 'react';
import { useI18n, Locale } from '@/lib/i18n';
import { Globe, ChevronUp } from 'lucide-react';

export function LanguageSwitcher({ direction = 'up' }: { direction?: 'up' | 'down' }) {
  const { locale, setLocale, localeNames } = useI18n();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleToggle = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const handleSelect = useCallback((key: Locale) => {
    setLocale(key);
    setOpen(false);
  }, [setLocale]);

  const localeEntries = Object.entries(localeNames) as [Locale, string][];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full"
      >
        <Globe className="h-4 w-4" />
        <span className="flex-1 text-left">{localeNames[locale]}</span>
        <ChevronUp className={`h-3 w-3 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
      {open && (
        <div className={`absolute left-0 right-0 z-50 ${direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="bg-popover border border-border rounded-lg shadow-lg py-1">
            {localeEntries.map(([key, name]) => (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  locale === key
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent/50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
