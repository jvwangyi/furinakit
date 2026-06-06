'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { withBasePath } from '@/lib/basePath';
import { useI18n } from '@/lib/i18n';

export default function VerifyRequestPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Mail className="h-5 w-5" />
            {t('auth.verify_request')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('auth.verify_request_desc')}
          </p>
          <Link
            href="/"
            className="text-sm text-primary hover:underline inline-block"
          >
            {t('auth.back_home')}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
