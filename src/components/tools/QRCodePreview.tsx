'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface QRCodePreviewProps {
  text: string;
  size?: number;
  errorCorrectionLevel?: string;
}

export function QRCodePreview({ text, size = 200, errorCorrectionLevel = 'M' }: QRCodePreviewProps) {
  const { t } = useI18n();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!text) {
      setQrDataUrl(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const QRCode = await import('qrcode');
        const dataUrl = await QRCode.toDataURL(text, {
          width: size,
          margin: 2,
          errorCorrectionLevel: (errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H') || 'M',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR preview error:', err);
        setQrDataUrl(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, size, errorCorrectionLevel]);

  if (!text) return null;

  return (
    <Card className="bg-muted/30 border border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          {t('tool.qr_preview')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center" style={{ width: size, height: size }}>
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code Preview"
              className="rounded-lg border bg-white p-2"
              style={{ maxWidth: size + 16 }}
            />
          ) : (
            <div className="text-sm text-muted-foreground">{t('tool.enter_text')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
