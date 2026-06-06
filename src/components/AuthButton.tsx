'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function AuthButton() {
  const { data: session } = useSession();
  const { t } = useI18n();

  const handleLogout = async () => {
    // Use signOut with redirect:false to clear server session
    await signOut({ redirect: false });
    // Clear the cookie explicitly
    document.cookie = 'next-auth.session-token=; path=/; maxAge=0';
    // Redirect to current origin's base path
    window.location.href = window.location.origin + '/furinakit/';
  };

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary transition-colors">
          <User className="h-4 w-4" />
          <span className="text-sm truncate max-w-[150px]">{session.user?.email}</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Link href="/auth/signin">
      <Button variant="outline" size="sm">
        <LogIn className="h-4 w-4 mr-1" />
        {t('auth.login') || '登录'}
      </Button>
    </Link>
  );
}
