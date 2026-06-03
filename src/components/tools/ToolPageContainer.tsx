'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { QRCodePreview } from '@/components/tools/QRCodePreview';
import { MarkdownPreview } from '@/components/tools/MarkdownPreview';
import { ToolOptions } from '@/components/tools/ToolOptions';
import { ToolHelp } from '@/components/tools/ToolHelp';
import { ToolFileSection } from '@/components/tools/ToolFileSection';
import { ToolResult } from '@/components/tools/ToolResult';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiPath } from '@/lib/utils';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { trackToolUsage } from '@/components/tools/RecentTools';
import { recordServerStats } from '@/lib/stats-client';
import type { ToolInfo, ToolApiResult } from '@/types/tool';
import { TermLabel } from '@/components/shared/TermLabel';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ToolPageContainerProps {
  category: string;
  toolName: string;
  t: (key: string) => string;
  tError: (key: string) => string;
  breadcrumbItems: BreadcrumbItem[];
  tool: ToolInfo;
}

function getExecuteText(toolName: string, t: (key: string) => string): string {
  if (toolName.includes('compress')) return t('tool.compress') || '压缩';
  if (toolName.includes('convert')) return t('tool.convert') || '转换';
  if (toolName.includes('resize')) return t('tool.resize') || '缩放';
  if (toolName.includes('gen')) return t('tool.generate') || '生成';
  if (toolName.includes('merge')) return t('tool.merge') || '合并';
  if (toolName.includes('split')) return t('tool.split') || '拆分';
  if (toolName.includes('rotate')) return t('tool.rotate') || '旋转';
  if (toolName.includes('crop')) return t('tool.crop') || '裁剪';
  if (toolName.includes('trim')) return t('tool.trim') || '裁剪';
  return t('tool.execute') || '执行';
}

export function ToolPageContainer({ category, toolName, t, tError, breadcrumbItems, tool }: ToolPageContainerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolApiResult | null>(null);

  // Form states
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [options, setOptions] = useState<Record<string, any>>({});

  // Image preview state
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Crop area state
  const [cropArea, setCropArea] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Ctrl+Enter shortcut ref
  const handleSubmitRef = useRef<() => void>(() => {});

  // QR code live preview state
  const [qrText, setQrText] = useState('');

  // Markdown live preview state
  const [markdownInput, setMarkdownInput] = useState('');

  // Auto-submit tools
  const autoSubmitTools = ['uuid-gen', 'password-gen', 'timestamp'];
  const autoSubmitWithTextTools = ['text-case', 'text-count'];

  // Derived flags (needed by handleSubmit)
  const isFileTool = category === 'pdf' || category === 'image' || category === 'audio' || category === 'video' ||
    ['image-to-pdf', 'csv-to-excel', 'excel-to-csv', 'image-to-base64', 'base64-to-image', 'file-info', 'file-hash'].includes(toolName);
  const isTextTool = category === 'text' || (category === 'dev' && toolName !== 'file-info' && toolName !== 'file-hash') ||
    (category === 'convert' && ['yaml-to-json', 'xml-to-json', 'markdown-to-pdf'].includes(toolName));

  // Memoize effective text to avoid recalculating in callbacks
  const effectiveText = (() => {
    if (toolName === 'qrcode-gen') return qrText;
    if (toolName === 'markdown-to-html') return markdownInput;
    return textInput;
  })();

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setProcessedPreview(null);

    try {
      const submitOptions = { ...options };
      if (toolName === 'image-crop' && cropArea) {
        submitOptions.left = cropArea.left;
        submitOptions.top = cropArea.top;
        submitOptions.width = cropArea.width;
        submitOptions.height = cropArea.height;
      }
      const isFileJsonTool = toolName === 'file-info' || toolName === 'file-hash';

      if (isFileJsonTool && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const body: Record<string, any> = {
          file: base64,
          filename: file.name,
          ...submitOptions,
        };

        const apiName = toolName.startsWith(category + '-') ? toolName.slice(category.length + 1) : toolName;
        const res = await fetch(apiPath(`/api/${category}/${apiName}`), {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          let errorMessage = t('tool.request_failed');
          try {
            const contentType = res.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              const error = await res.json();
              errorMessage = tError(error.error?.message) || errorMessage;
            } else {
              const text = await res.text();
              if (text) errorMessage = text.substring(0, 200);
            }
          } catch {}
          throw new Error(errorMessage);
        }

        const data = await res.json();
        setResult(data.data);
        trackToolUsage(toolName, category);
        recordServerStats(toolName);
        return;
      }

      const formData = new FormData();

      if (isFileTool && files.length > 0) {
        const isMultiFileTool = ['pdf-merge', 'image-merge', 'image-to-pdf'].includes(toolName);
        const fileKey = isMultiFileTool ? 'files' : 'file';
        files.forEach(file => formData.append(fileKey, file));
      }

      Object.entries(submitOptions).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (isTextTool) {
        formData.append('text', effectiveText);
      }

      const isQrTool = toolName === 'qrcode-gen';

      const apiName = toolName.startsWith(category + '-') ? toolName.slice(category.length + 1) : toolName;
      const res = await fetch(apiPath(`/api/${category}/${apiName}`), {
        method: 'POST',
        body: (isTextTool || isQrTool) ? JSON.stringify({
          ...(toolName === 'text-diff' ? { newText: effectiveText } : { text: effectiveText }),
          ...submitOptions,
        }) : formData,
        headers: (isTextTool || isQrTool) ? { 'Content-Type': 'application/json' } : undefined,
      });

      if (!res.ok) {
        let errorMessage = t('tool.request_failed');
        try {
          const errorContentType = res.headers.get('content-type');
          if (errorContentType?.includes('application/json')) {
            const error = await res.json();
            errorMessage = tError(error.error?.message) || errorMessage;
          } else {
            const text = await res.text();
            if (text) errorMessage = text.substring(0, 200);
          }
        } catch {}
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const data = await res.json();
        setResult(data.data);
        trackToolUsage(toolName, category);
        recordServerStats(toolName);
      } else {
        const blob = await res.blob();

        if (category === 'image' && blob.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => setProcessedPreview(e.target?.result as string);
          reader.readAsDataURL(blob);
        }

        // Store blob URL for download button
        const url = URL.createObjectURL(blob);
        setResult({
          downloadUrl: url,
          mimeType: blob.type || 'application/octet-stream',
          filename: res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'output',
          size: blob.size,
        });

        trackToolUsage(toolName, category);
        recordServerStats(toolName);
      }
    } catch (error) {
      toast.error(tError((error as Error).message));
    } finally {
      setLoading(false);
    }
  }, [toolName, category, options, cropArea, files, isFileTool, isTextTool, effectiveText, t, tError]);

  // Keep ref in sync for keyboard shortcut
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (autoSubmitTools.includes(toolName) && tool) {
      handleSubmit();
    }
  }, [options, toolName, tool, handleSubmit]);

  useEffect(() => {
    if (autoSubmitWithTextTools.includes(toolName) && tool && textInput) {
      handleSubmit();
    }
  }, [options, textInput, toolName, tool, handleSubmit]);

  // Generate image preview when files change
  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(newFiles);
    setProcessedPreview(null);
    setCurrentFileIndex(0);
    if (newFiles.length > 0 && category === 'image') {
      const previews: string[] = [];
      let loaded = 0;
      newFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          previews[index] = e.target?.result as string;
          loaded++;
          if (loaded === newFiles.length) {
            setImagePreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setImagePreviews([]);
    }
  };

  const noTextInput = ['uuid-gen', 'password-gen', 'color-convert'].includes(toolName);
  const showTextInput = isTextTool && !noTextInput && toolName !== 'markdown-to-html' && toolName !== 'qrcode-gen';

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitRef.current();
        return;
      }
      if (e.key === 'Escape') {
        setResult(null);
        setProcessedPreview(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isDisabled = loading ||
    (isFileTool && files.length === 0) ||
    (showTextInput && !textInput) ||
    (toolName === 'qrcode-gen' && !qrText) ||
    (toolName === 'markdown-to-html' && !markdownInput);

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <Breadcrumb items={breadcrumbItems} />
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300 border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t(`tool.${toolName}`) || tool.name}</CardTitle>
              <CardDescription>{t(`tool.${toolName}.desc`) || tool.description}</CardDescription>
            </div>
            <ToolHelp toolName={toolName} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isFileTool && (
            <ToolFileSection
              category={category}
              toolName={toolName}
              files={files}
              onFilesSelected={handleFilesSelected}
              imagePreviews={imagePreviews}
              processedPreview={processedPreview}
              currentFileIndex={currentFileIndex}
              setCurrentFileIndex={setCurrentFileIndex}
              t={t}
            />
          )}

          {showTextInput && (
            <div>
              <Label>{t('tool.input')}</Label>
              <Textarea
                placeholder={t('tool.input.placeholder')}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
              />
            </div>
          )}

          {/* QR Code: dedicated text input + real-time preview */}
          {toolName === 'qrcode-gen' && (
            <div className="space-y-4">
              <div>
                <Label>{t('tool.input')}</Label>
                <Textarea
                  placeholder={t('tool.qr_input_placeholder')}
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  rows={3}
                />
              </div>
              <QRCodePreview
                text={qrText}
                size={options.size || 256}
                errorCorrectionLevel={options.errorCorrectionLevel || 'M'}
              />
            </div>
          )}

          {/* Markdown live preview */}
          {toolName === 'markdown-to-html' && (
            <MarkdownPreview
              value={markdownInput}
              onChange={setMarkdownInput}
            />
          )}

          <ToolOptions
            toolName={toolName}
            options={options}
            setOptions={setOptions}
            textInput={textInput}
          />

          <Button
            onClick={handleSubmit}
            disabled={isDisabled}
            className="w-full bg-primary hover:bg-primary/90 active:scale-[0.99] shadow-sm hover:shadow-md transition-all duration-200 h-11 text-base font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('tool.processing')}
              </>
            ) : (
              getExecuteText(toolName, t)
            )}
          </Button>
          <p className="text-xs text-muted-foreground/70 text-center -mt-2">
            {t('tool.shortcut_hint') || 'Ctrl + Enter 快捷提交'}
          </p>

          <ToolResult
            result={result}
            toolName={toolName}
            files={files}
            t={t}
            tError={tError}
          />

        </CardContent>
      </Card>
    </div>
  );
}
