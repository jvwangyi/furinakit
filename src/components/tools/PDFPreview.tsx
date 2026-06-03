'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface PDFPreviewProps {
  file: File | null;
}

export function PDFPreview({ file }: PDFPreviewProps) {
  const { t } = useI18n();
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    if (!file) {
      pdfRef.current = null;
      setPageCount(0);
      setCurrentPage(1);
      return;
    }

    // Cancel any in-flight render
    const id = ++renderIdRef.current;
    setLoading(true);
    const loadPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        // Check if still current
        if (renderIdRef.current !== id) return;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (renderIdRef.current !== id) return;
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        setCurrentPage(1);
        await renderPage(pdf, 1, id);
      } catch (err) {
        if (renderIdRef.current === id) {
          console.error('PDF preview error:', err);
        }
      } finally {
        if (renderIdRef.current === id) {
          setLoading(false);
        }
      }
    };
    loadPdf();
  }, [file]);

  const renderPage = async (pdf: any, pageNum: number, renderId?: number) => {
    if (!canvasRef.current) return;
    const id = renderId ?? renderIdRef.current;
    try {
      const page = await pdf.getPage(pageNum);
      if (renderIdRef.current !== id) return;
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    } catch (err) {
      if (renderIdRef.current === id) {
        console.error('Page render error:', err);
      }
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!pdfRef.current || newPage < 1 || newPage > pageCount) return;
    setCurrentPage(newPage);
    const id = renderIdRef.current;
    try {
      await renderPage(pdfRef.current, newPage, id);
    } catch (err) {
      if (renderIdRef.current === id) {
        console.error('Page render error:', err);
      }
    }
  };

  if (!file) return null;

  return (
    <Card className="bg-muted/30 border border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('tool.pdf_preview')}
          </CardTitle>
          {pageCount > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                {currentPage} / {pageCount}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pageCount || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden bg-background flex justify-center relative">
          <canvas
            ref={canvasRef}
            className="max-h-[500px] w-auto"
            style={{ maxWidth: '100%' }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
