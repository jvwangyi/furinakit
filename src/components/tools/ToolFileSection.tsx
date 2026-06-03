'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/tools/FileUploader';
import { ImagePreview } from '@/components/tools/ImagePreview';
import { PDFPreview } from '@/components/tools/PDFPreview';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ToolFileSectionProps {
  category: string;
  toolName: string;
  files: File[];
  onFilesSelected: (files: File[]) => void;
  imagePreviews: string[];
  processedPreview: string | null;
  currentFileIndex: number;
  setCurrentFileIndex: (index: number) => void;
  t: (key: string) => string;
}

export function ToolFileSection({
  category,
  toolName,
  files,
  onFilesSelected,
  imagePreviews,
  processedPreview,
  currentFileIndex,
  setCurrentFileIndex,
  t,
}: ToolFileSectionProps) {
  return (
    <>
      <FileUploader
        onFilesSelected={onFilesSelected}
        multiple={toolName === 'pdf-merge' || toolName === 'image-merge'}
        accept={category === 'pdf' ? { 'application/pdf': ['.pdf'] } :
               category === 'image' ? { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] } :
               undefined}
      />

      {/* Multi-file list with navigation */}
      {files.length > 1 && (
        <Card className="bg-muted/30 border border-border/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {t('tool.file_list')} ({files.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setCurrentFileIndex(Math.max(0, currentFileIndex - 1))}
                  disabled={currentFileIndex <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                  {currentFileIndex + 1} / {files.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setCurrentFileIndex(Math.min(files.length - 1, currentFileIndex + 1))}
                  disabled={currentFileIndex >= files.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <button
                  key={`${file.name}-${index}`}
                  type="button"
                  onClick={() => setCurrentFileIndex(index)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-150 ${
                    index === currentFileIndex
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background hover:bg-muted border border-transparent hover:border-border/30'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{file.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image preview for image tools */}
      {category === 'image' && imagePreviews.length > 0 && (
        <ImagePreview
          original={imagePreviews[currentFileIndex]}
          processed={processedPreview}
          title={`${t('tool.image_preview')} (${currentFileIndex + 1}/${files.length})`}
          onDownload={processedPreview ? () => {
            const a = document.createElement('a');
            a.href = processedPreview;
            a.download = 'processed-image';
            a.click();
          } : undefined}
        />
      )}

      {/* PDF preview for PDF tools */}
      {category === 'pdf' && files.length > 0 && (
        <PDFPreview
          file={files[currentFileIndex]}
        />
      )}
    </>
  );
}
