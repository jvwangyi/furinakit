'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Columns, FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface MarkdownPreviewProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownPreview({ value, onChange, placeholder }: MarkdownPreviewProps) {
  const { t } = useI18n();
  const [html, setHtml] = useState('');
  const [layout, setLayout] = useState<'split' | 'edit' | 'preview'>('split');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!value) {
      setHtml('');
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const { marked } = await import('marked');
        const result = await marked(value, {
          gfm: true,
          breaks: false,
        });
        setHtml(result as string);
      } catch {
        setHtml('<p style="color: red;">Preview error</p>');
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  return (
    <Card className="bg-muted/30 border border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('tool.markdown_preview')}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant={layout === 'edit' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setLayout('edit')}
              title={t('tool.edit_only')}
            >
              <EyeOff className="h-3 w-3" />
            </Button>
            <Button
              variant={layout === 'split' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setLayout('split')}
              title={t('tool.split_view')}
            >
              <Columns className="h-3 w-3" />
            </Button>
            <Button
              variant={layout === 'preview' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setLayout('preview')}
              title={t('tool.preview_only')}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`${layout === 'split' ? 'grid grid-cols-2 gap-4' : ''}`}>
          {layout !== 'preview' && (
            <div className="space-y-2">
              {layout === 'split' && (
                <Label className="text-xs text-muted-foreground">{t('tool.input')}</Label>
              )}
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || t('tool.markdown_placeholder')}
                className="min-h-[300px] font-mono text-sm resize-y"
              />
            </div>
          )}
          {layout !== 'edit' && (
            <div className="space-y-2">
              {layout === 'split' && (
                <Label className="text-xs text-muted-foreground">{t('tool.preview')}</Label>
              )}
              <div
                className="min-h-[300px] p-4 bg-background rounded-lg border border-border/50 overflow-auto text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-3 [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-auto [&_pre]:mb-3 [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:p-2 [&_hr]:border-border [&_hr]:my-4 [&_img]:max-w-full [&_img]:rounded"
                dangerouslySetInnerHTML={{ __html: html || '<p class="text-muted-foreground text-sm">...</p>' }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
