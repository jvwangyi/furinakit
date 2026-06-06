'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useI18n } from '@/lib/i18n';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [isAnimating, setIsAnimating] = useState(false);

  const cycle = useCallback(() => {
    setIsAnimating(true);

    // Add transition class to html for smooth theme switch
    document.documentElement.classList.add('theme-transitioning');

    const next: Record<string, string> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    setTheme(next[theme] as 'light' | 'dark' | 'system');

    // Remove animation class after animation completes
    setTimeout(() => setIsAnimating(false), 300);
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
  }, [theme, setTheme]);

  const icons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const labels = {
    light: t('theme.light'),
    dark: t('theme.dark'),
    system: t('theme.system'),
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      title={labels[theme]}
      aria-label={`${t('theme.switch_prefix')}${labels[theme]}`}
      className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
    >
      <span
        className={isAnimating ? 'animate-rotate-in inline-flex' : 'inline-flex'}
        style={{ transformOrigin: 'center center' }}
      >
        {icons[theme]}
      </span>
    </Button>
  );
}
