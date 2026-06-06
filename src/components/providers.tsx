'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { reportWebVitals } from '@/lib/analytics';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    reportWebVitals();
  }, []);
  return (
    <SessionProvider basePath="/furinakit/api/auth">
      <I18nProvider>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
