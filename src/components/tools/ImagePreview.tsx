'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Download, Maximize2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ImagePreviewProps {
  /** Original image data URL */
  original: string | null;
  /** Processed image data URL */
  processed?: string | null;
  /** Title for the preview section */
  title?: string;
  /** Callback when download is clicked on processed image */
  onDownload?: () => void;
}

export function ImagePreview({ original, processed, title, onDownload }: ImagePreviewProps) {
  const { t } = useI18n();
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove as any);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove as any);
    };
  }, [handleMouseUp, handleMouseMove, handleTouchMove]);

  if (!original) return null;

  const hasProcessed = !!processed;

  return (
    <Card className="bg-muted/30 border border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {title || t('tool.preview')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasProcessed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="h-8 text-xs"
              >
                {showComparison ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    {t('tool.hide_comparison')}
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    {t('tool.show_comparison')}
                  </>
                )}
              </Button>
            )}
            {hasProcessed && onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload} className="h-8 text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {t('tool.download')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasProcessed && showComparison ? (
          /* Comparison slider view */
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-lg border cursor-col-resize select-none"
            style={{ maxHeight: '500px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {/* Processed image (full width, behind) */}
            <img
              src={processed}
              alt="Processed"
              className="w-full h-auto block"
              draggable={false}
            />
            {/* Original image (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={original}
                alt="Original"
                className="w-full h-auto block"
                draggable={false}
              />
            </div>
            {/* Slider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                <Maximize2 className="h-4 w-4 text-foreground" />
              </div>
            </div>
            {/* Labels */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {t('tool.original')}
            </div>
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {t('tool.processed_label')}
            </div>
          </div>
        ) : hasProcessed ? (
          /* Side by side view */
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">{t('tool.original')}</p>
              <div className="rounded-lg border overflow-hidden bg-background">
                <img
                  src={original}
                  alt="Original"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">{t('tool.processed_label')}</p>
              <div className="rounded-lg border overflow-hidden bg-background">
                <img
                  src={processed}
                  alt="Processed"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Single preview */
          <div className="rounded-lg border overflow-hidden bg-background">
            <img
              src={original}
              alt="Preview"
              className="w-full h-auto max-h-80 object-contain mx-auto"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
