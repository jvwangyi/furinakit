'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PDFPreviewProps {
  file: File | null;
}

interface PageMeta {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Worker bootstrap – CDN with local fallback
// ---------------------------------------------------------------------------

let workerReady: Promise<void> | null = null;

async function ensureWorker(pdfjsLib: any) {
  if (workerReady) return workerReady;

  workerReady = (async () => {
    // Try CDN first
    try {
      const cdnUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrl;
      // Quick probe – load a trivial doc to validate worker
      // (if worker fails, getDocument throws)
      return;
    } catch {
      // fall through
    }

    // Fallback: use unpkg
    try {
      const unpkgUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = unpkgUrl;
      return;
    } catch {
      // fall through
    }

    // Last resort: disable worker (runs on main thread, slower but works)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  })();

  return workerReady;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PDFPreview({ file }: PDFPreviewProps) {
  const { t } = useI18n();

  // PDF state
  const [pageCount, setPageCount] = useState(0);
  const [pageMetas, setPageMetas] = useState<PageMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [fitWidth, setFitWidth] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Refs
  const pdfRef = useRef<any>(null);
  const renderIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const intersectionRef = useRef<IntersectionObserver | null>(null);

  // Track which pages are visible
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());

  // Zoom presets
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2.0;
  const ZOOM_STEP = 0.25;

  const zoomIn = useCallback(() => {
    setFitWidth(false);
    setScale((s) => Math.min(ZOOM_MAX, +(s + ZOOM_STEP).toFixed(2)));
  }, []);

  const zoomOut = useCallback(() => {
    setFitWidth(false);
    setScale((s) => Math.max(ZOOM_MIN, +(s - ZOOM_STEP).toFixed(2)));
  }, []);

  const resetZoom = useCallback(() => {
    setFitWidth(true);
    setScale(1.0);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setFullscreen((f) => !f);
  }, []);

  // Compute effective scale: fit-width uses container width / page width
  const effectiveScale = useMemo(() => {
    if (!fitWidth || pageMetas.length === 0) return scale;
    const container = containerRef.current;
    if (!container) return scale;
    const maxW = container.clientWidth - 32; // padding
    const pageW = pageMetas[0]?.width ?? 612; // default letter width
    const fitted = maxW / pageW;
    return Math.min(fitted, 2.0);
  }, [fitWidth, scale, pageMetas]);

  // -----------------------------------------------------------------------
  // Load PDF
  // -----------------------------------------------------------------------

  const loadPdf = useCallback(async (f: File) => {
    const id = ++renderIdRef.current;
    setLoading(true);
    setError(null);
    renderedPagesRef.current.clear();

    try {
      const pdfjsLib = await import('pdfjs-dist');
      await ensureWorker(pdfjsLib);

      const arrayBuffer = await f.arrayBuffer();
      if (renderIdRef.current !== id) return;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      if (renderIdRef.current !== id) return;

      pdfRef.current = pdf;
      const numPages = pdf.numPages;
      setPageCount(numPages);

      // Pre-fetch page dimensions for layout
      const metas: PageMeta[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        if (renderIdRef.current !== id) return;
        const vp = page.getViewport({ scale: 1 });
        metas.push({ width: vp.width, height: vp.height });
      }
      setPageMetas(metas);
    } catch (err: any) {
      if (renderIdRef.current === id) {
        console.error('PDF load error:', err);
        setError(err?.message ?? 'Unknown error');
      }
    } finally {
      if (renderIdRef.current === id) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!file) {
      pdfRef.current = null;
      setPageCount(0);
      setPageMetas([]);
      setError(null);
      renderedPagesRef.current.clear();
      return;
    }
    loadPdf(file);
  }, [file, loadPdf]);

  // -----------------------------------------------------------------------
  // Render a single page into a canvas
  // -----------------------------------------------------------------------

  const renderPage = useCallback(
    async (pageNum: number) => {
      const pdf = pdfRef.current;
      if (!pdf) return;
      const canvas = canvasRefs.current.get(pageNum);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const id = renderIdRef.current;

      try {
        const page = await pdf.getPage(pageNum);
        if (renderIdRef.current !== id) return;

        const viewport = page.getViewport({ scale: effectiveScale });
        const dpr = window.devicePixelRatio || 1;

        // Set canvas internal resolution
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        // Set CSS display size
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, viewport.width, viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (renderIdRef.current !== id) return;

        renderedPagesRef.current.add(pageNum);
      } catch (err) {
        if (renderIdRef.current === id) {
          console.error(`Page ${pageNum} render error:`, err);
        }
      }
    },
    [effectiveScale],
  );

  // -----------------------------------------------------------------------
  // IntersectionObserver for virtual rendering
  // -----------------------------------------------------------------------

  useEffect(() => {
    // Clean up old observer
    if (intersectionRef.current) {
      intersectionRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const newVisible = new Set(visiblePages);
        for (const entry of entries) {
          const page = Number(entry.target.getAttribute('data-page'));
          if (entry.isIntersecting) {
            newVisible.add(page);
          } else {
            newVisible.delete(page);
          }
        }
        setVisiblePages(newVisible);
      },
      {
        root: scrollRef.current,
        rootMargin: '200px 0px', // pre-render 200px above/below
        threshold: 0,
      },
    );

    intersectionRef.current = observer;

    // Observe all page placeholders
    const container = scrollRef.current;
    if (container) {
      container.querySelectorAll('[data-page]').forEach((el) => {
        observer.observe(el);
      });
    }

    return () => {
      observer.disconnect();
    };
  }, [pageCount, effectiveScale]); // re-observe when pages or scale change

  // -----------------------------------------------------------------------
  // Render visible pages
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!pdfRef.current || pageCount === 0) return;
    const id = renderIdRef.current;

    const renderVisible = async () => {
      // Render visible pages + 1 page buffer on each side
      const toRender = new Set<number>();
      for (const p of visiblePages) {
        toRender.add(p);
        if (p > 1) toRender.add(p - 1);
        if (p < pageCount) toRender.add(p + 1);
      }

      for (const pageNum of toRender) {
        if (renderIdRef.current !== id) return;
        // Skip if already rendered at current scale
        if (renderedPagesRef.current.has(pageNum)) continue;
        await renderPage(pageNum);
      }
    };

    renderVisible();
  }, [visiblePages, pageCount, effectiveScale, renderPage]);

  // Re-render all visible pages when scale changes
  const prevScaleRef = useRef(effectiveScale);
  useEffect(() => {
    if (prevScaleRef.current !== effectiveScale) {
      prevScaleRef.current = effectiveScale;
      renderedPagesRef.current.clear();
    }
  }, [effectiveScale]);

  // -----------------------------------------------------------------------
  // Register canvas ref
  // -----------------------------------------------------------------------

  const setCanvasRef = useCallback(
    (pageNum: number, el: HTMLCanvasElement | null) => {
      if (el) {
        canvasRefs.current.set(pageNum, el);
      } else {
        canvasRefs.current.delete(pageNum);
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Retry
  // -----------------------------------------------------------------------

  const handleRetry = useCallback(() => {
    if (file) loadPdf(file);
  }, [file, loadPdf]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (!file) return null;

  const isEmpty = pageCount === 0 && !loading && !error;

  return (
    <Card
      className={`bg-muted/30 border border-border/30 ${
        fullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col' : ''
      }`}
    >
      <CardHeader className={fullscreen ? 'pb-2 flex-shrink-0' : 'pb-3'}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('tool.pdf_preview')}
            {pageCount > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                {pageCount} {t('tool.pages_count')}
              </span>
            )}
          </CardTitle>

          {pageCount > 0 && (
            <div className="flex items-center gap-1">
              {/* Zoom controls */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="h-8 w-8"
                    onClick={zoomOut}
                    disabled={effectiveScale <= ZOOM_MIN}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>{t('tool.zoom_out')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-xs text-muted-foreground min-w-[40px] text-center tabular-nums">
                {Math.round(effectiveScale * 100)}%
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="h-8 w-8"
                    onClick={zoomIn}
                    disabled={effectiveScale >= ZOOM_MAX}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>{t('tool.zoom_in')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="h-8 w-8"
                    onClick={resetZoom}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>{t('tool.fit_width')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Fullscreen toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="h-8 w-8"
                    onClick={toggleFullscreen}
                  >
                    {fullscreen ? (
                      <Minimize2 className="h-3.5 w-3.5" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {fullscreen ? t('tool.exit_fullscreen') : t('tool.fullscreen')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={fullscreen ? 'flex-1 overflow-hidden flex flex-col' : ''}>
        <div
          ref={containerRef}
          className={`rounded-lg border border-border/50 overflow-hidden bg-background relative ${
            fullscreen ? 'flex-1 flex flex-col' : ''
          }`}
        >
          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center py-12 px-4 gap-3">
              <FileText className="h-8 w-8 text-destructive/60" />
              <p className="text-sm text-destructive text-center">
                {t('tool.pdf_preview_error')}
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-md break-all">
                {error}
              </p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                {t('tool.retry')}
              </Button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-xs text-muted-foreground">
                  {t('tool.loading_preview')}
                </span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex items-center justify-center py-12 px-4">
              <p className="text-sm text-muted-foreground">
                {t('tool.pdf_preview_error')}
              </p>
            </div>
          )}

          {/* Multi-page scroll view */}
          {pageCount > 0 && !loading && (
            <div
              ref={scrollRef}
              className={`overflow-auto ${
                fullscreen ? 'flex-1' : 'max-h-[600px]'
              }`}
            >
              <div className="flex flex-col items-center gap-4 py-4 px-2">
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                  (pageNum) => {
                    const meta = pageMetas[pageNum - 1];
                    const displayW = meta
                      ? Math.floor(meta.width * effectiveScale)
                      : undefined;
                    const displayH = meta
                      ? Math.floor(meta.height * effectiveScale)
                      : undefined;

                    return (
                      <div
                        key={pageNum}
                        data-page={pageNum}
                        className="relative shadow-sm border border-border/30 rounded"
                        style={{
                          width: displayW ? `${displayW}px` : '100%',
                          height: displayH ? `${displayH}px` : undefined,
                          minHeight: displayH ? undefined : '200px',
                        }}
                      >
                        <canvas
                          ref={(el) => setCanvasRef(pageNum, el)}
                          className="block"
                        />
                        {/* Page number label */}
                        <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground/60 select-none">
                          {pageNum}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
