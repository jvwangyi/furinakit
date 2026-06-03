'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, File } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatFileSize } from '@/lib/format';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number;
  label?: string;
}

export function FileUploader({
  onFilesSelected,
  accept,
  multiple = false,
  maxSize,
  label
}: FileUploaderProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = multiple ? [...files, ...acceptedFiles] : acceptedFiles;
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, multiple, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  // Build format hint text from accept prop
  const formatHint = accept ? Object.values(accept).flat().join(', ').toUpperCase() : null;
  const maxSizeMB = maxSize ? (maxSize / (1024 * 1024)).toFixed(0) : null;

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`p-6 sm:p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary bg-primary/10 scale-[1.01] shadow-md shadow-primary/10'
            : 'border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`p-3 rounded-full transition-all duration-200 ${isDragActive ? 'bg-primary/10 scale-110' : 'bg-muted/50'}`}>
            <Upload className={`h-8 w-8 transition-all duration-200 ${isDragActive ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium">{label || t('uploader.drop_text')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('uploader.or_click') || 'or click to browse'}</p>
          </div>
        </div>
      </Card>

      {(formatHint || maxSizeMB) && (
        <p className="text-xs text-muted-foreground text-center">
          {formatHint && maxSizeMB
            ? t('uploader.format_hint_with_size').replace('{formats}', formatHint).replace('{size}', maxSizeMB)
            : formatHint
              ? t('uploader.format_hint').replace('{formats}', formatHint)
              : t('uploader.size_hint').replace('{size}', maxSizeMB!)
          }
        </p>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors min-h-[48px]"
            >
              <File className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
