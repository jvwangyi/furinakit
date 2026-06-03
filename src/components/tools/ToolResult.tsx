'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { JsonTreeView } from '@/components/tools/JsonTreeView';
import { DiffViewer } from '@/components/tools/DiffViewer';
import { toast } from 'sonner';
import { Download, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { FeedbackForm } from '@/components/tools/FeedbackForm';
import type { ToolApiResult } from '@/types/tool';

interface ToolResultProps {
  result: ToolApiResult | null;
  toolName: string;
  files: File[];
  t: (key: string) => string;
  tError: (key: string) => string;
}

function FileSizeComparison({ files, result, t }: { files: File[]; result: ToolApiResult; t: (key: string) => string }) {
  if (files.length === 0 || !result.data) return null;

  const originalSize = files[0].size;
  const resultBytes = Math.floor(result.data.length * 3 / 4);
  const ratio = originalSize > 0 ? ((1 - resultBytes / originalSize) * 100).toFixed(1) : '0';
  const isSmaller = resultBytes < originalSize;
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 p-5 rounded-xl border ${
      isSmaller
        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800/40'
        : 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/40'
    }`}>
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">{t('compare.original')}</p>
        <p className="text-lg font-mono font-bold">{formatSize(originalSize)}</p>
      </div>
      <div className={`text-2xl font-bold ${isSmaller ? 'text-green-500' : 'text-orange-500'}`}>
        →
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">{t('compare.processed')}</p>
        <p className="text-lg font-mono font-bold">{formatSize(resultBytes)}</p>
      </div>
      <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
        isSmaller
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
      }`}>
        {isSmaller ? `${ratio}% ↓` : `${Math.abs(parseFloat(ratio))}% ↑`}
      </div>
    </div>
  );
}

export function ToolResult({ result, toolName, files, t, tError }: ToolResultProps) {
  if (!result) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('tool.copied_toast'));
  };

  return (
    <Card className="bg-muted/40 border border-border/50 animate-slide-up">
      <CardContent className="p-4 sm:p-6">
        {/* Success banner */}
        <div className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-lg bg-green-50/80 border border-green-200/60 dark:bg-green-950/30 dark:border-green-800/30">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">{t('result.success')}</span>
        </div>

        {result.text && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t('tool.result')}</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[40px] hover:bg-muted"
                  onClick={() => {
                    const blob = new Blob([result.text ?? ''], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${toolName}-result.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  {t('btn.download_result')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[40px] hover:bg-muted"
                  onClick={() => copyToClipboard(result.text!)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {t('tool.copy')}
                </Button>
              </div>
            </div>
            {toolName === 'json-format' ? (
              (() => {
                try {
                  const parsed = JSON.parse(result.text);
                  return (
                    <div className="space-y-4">
                      <JsonTreeView data={parsed} />
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          {t('tool.raw_json')}
                        </summary>
                        <pre className="p-4 bg-background rounded-lg border border-border/30 overflow-auto max-h-96 text-sm break-all whitespace-pre-wrap">
                          {result.text}
                        </pre>
                      </details>
                    </div>
                  );
                } catch {
                  return (
                    <pre className="p-4 bg-background rounded-lg border border-border/30 overflow-auto max-h-96 text-sm break-all whitespace-pre-wrap">
                      {result.text}
                    </pre>
                  );
                }
              })()
            ) : toolName === 'text-diff' ? (
              <DiffViewer diffText={result.text} />
            ) : (
              <pre className="p-4 bg-background rounded-lg border border-border/30 overflow-auto max-h-96 text-sm break-all whitespace-pre-wrap">
                {result.text}
              </pre>
            )}
          </div>
        )}

        {(result.data || result.downloadUrl) && !result.text && (
          <div className="text-center space-y-4">
            <FileSizeComparison files={files} result={result} t={t} />
            <p className="text-sm text-muted-foreground">
              {t('tool.file_result')}
            </p>
            <Button
              onClick={() => {
                const a = document.createElement('a');
                if (result.downloadUrl) {
                  a.href = result.downloadUrl;
                } else {
                  a.href = `data:${result.mimeType};base64,${result.data}`;
                }
                a.download = result.filename || 'output';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('tool.download')}
            </Button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-muted/60">
          <FeedbackForm toolName={toolName} />
        </div>
      </CardContent>
    </Card>
  );
}
