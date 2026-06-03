'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Upload, Image as ImageIcon, ShoppingBag, HelpCircle, Sliders, ZoomIn, ZoomOut, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { generatePerlerPattern, generateShoppingList, PALETTES, PALETTE_NAMES, getColorStats, paintPixel, preprocessImageOnly, PreprocessResult, generateSketch, floodFillErase, replaceColor, getFilteredPalette, hexToRgb } from '@/lib/tools/perler-beads';
import { useI18n } from '@/lib/i18n';
import { CropSelector } from '@/components/tools/CropSelector';
import { MousePointer, Eraser, Palette, BarChart3, Pencil } from 'lucide-react';

export function PerlerBeadsClient() {
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number; size: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [gridSize, setGridSize] = useState(58);
  const [palette, setPalette] = useState('mard221');
  const [mergeSimilar, setMergeSimilar] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [pixelMode, setPixelMode] = useState<'dominant' | 'average' | 'smart'>('smart');
  const [dithering, setDithering] = useState(false);
  const [colorDistance, setColorDistance] = useState<'oklab' | 'rgb' | 'ciede2000'>('ciede2000');
  const fileRef = useRef<HTMLInputElement>(null);
  // 预处理选项
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [colorTemperature, setColorTemperature] = useState(0);
  const [sharpen, setSharpen] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [removeBg, setRemoveBg] = useState(false);
  const [preprocessedPreview, setPreprocessedPreview] = useState<string | null>(null);
  const [preprocessedResult, setPreprocessedResult] = useState<PreprocessResult | null>(null);
  const [actualGridSize, setActualGridSize] = useState<{width: number, height: number} | null>(null);
  // 新功能状态
  const [excludedColors, setExcludedColors] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editColor, setEditColor] = useState<string>('');
  const [colorStats, setColorStats] = useState<{colorId: string; hex: string; count: number; percentage: number}[]>([]);
  const [grid, setGrid] = useState<string[][] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(20);
  const [padding, setPadding] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [sketchPreviewOriginal, setSketchPreviewOriginal] = useState<string | null>(null);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ dist: 0, zoom: 1 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, panX: 0, panY: 0 });
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // 鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editMode) return;
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      panX,
      panY,
    };
    if (resultContainerRef.current) resultContainerRef.current.style.cursor = 'grabbing';
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.dragging) return;
    setPanX(dragRef.current.panX + (e.clientX - dragRef.current.startX));
    setPanY(dragRef.current.panY + (e.clientY - dragRef.current.startY));
  };
  const handleMouseUp = () => {
    dragRef.current.dragging = false;
    if (resultContainerRef.current) resultContainerRef.current.style.cursor = 'grab';
  };

  // 触摸手势（单指拖拽 + 双指缩放）— 直接绑定非被动监听器
  useEffect(() => {
    const container = resultContainerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (editMode) return;
      if (e.touches.length === 1) {
        e.preventDefault();
        setPanX(prev => {
          setPanY(prevY => {
            dragRef.current = {
              dragging: true,
              startX: e.touches[0].clientX,
              startY: e.touches[0].clientY,
              panX: prev,
              panY: prevY,
            };
            return prevY;
          });
          return prev;
        });
      } else if (e.touches.length === 2) {
        e.preventDefault();
        dragRef.current.dragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), zoom };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (editMode) return;
      if (e.touches.length === 1 && dragRef.current.dragging) {
        e.preventDefault();
        setPanX(dragRef.current.panX + (e.touches[0].clientX - dragRef.current.startX));
        setPanY(dragRef.current.panY + (e.touches[0].clientY - dragRef.current.startY));
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = dist / touchRef.current.dist;
        setZoom(Math.max(0.25, Math.min(10, touchRef.current.zoom * scale)));
      }
    };

    const onTouchEnd = () => {
      dragRef.current.dragging = false;
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [editMode, zoom, panX, panY, result]);

  // 滚轮缩放（useEffect 直接绑定非被动监听器，阻止页面滚动）
  useEffect(() => {
    const container = resultContainerRef.current;
    if (!container) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.25, Math.min(10, z + delta)));
    };
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, [result]);
  const [sketchPreviewScaled, setSketchPreviewScaled] = useState<string | null>(null);
  const [sketchGridSize, setSketchGridSize] = useState<{w: number, h: number} | null>(null);
  const [resultPreview, setResultPreview] = useState<string | null>(null);
  const [hollowCircle, setHollowCircle] = useState(true);
  const [shoppingExpanded, setShoppingExpanded] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [excludeExpanded, setExcludeExpanded] = useState(false);
  const [showAllShopping, setShowAllShopping] = useState(false);
  const [cropArea, setCropArea] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // 生成结果时渲染 canvas
  useEffect(() => {
    if (grid && result && canvasRef.current) {
      renderGridToCanvas(grid);
      // 自适应缩放：canvas 渲染完后计算适合容器的缩放
      const container = resultContainerRef.current;
      if (container && grid[0]) {
        const canvasW = grid[0].length * cellSize + padding * 2;
        const canvasH = grid.length * cellSize + padding * 2;
        const fitZoom = Math.min(container.clientWidth / canvasW, container.clientHeight / canvasH, 1);
        setZoom(Math.max(0.1, Math.round(fitZoom * 100) / 100));
      }
    }
  }, [result]);

  // 切换编辑模式时重新渲染
  useEffect(() => {
    if (grid && canvasRef.current) {
      renderGridToCanvas(grid);
    }
  }, [editMode]);

  // 粘贴图片支持
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            processFile(blob);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const preprocessRef = useRef({ brightness, contrast, saturation, colorTemperature, sharpen, denoise, removeBg });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const processFile = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      toast.error(t('perler.supported_formats'));
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      toast.error(t('perler.file_too_large'));
      return;
    }
      setFile(selected);
      setResult(null);
      setStats(null);
      setCropArea(null);
      setPreprocessedPreview(null);
      setPreprocessedResult(null);
      setSketchPreviewOriginal(null);
      setSketchPreviewScaled(null);
      setSketchGridSize(null);
      setResultPreview(null);
      setGrid(null);
      setColorStats([]);
      setImageInfo(null);
      // 重置预处理参数
      setBrightness(0);
      setContrast(0);
      setSaturation(0);
      setColorTemperature(0);
      setSharpen(false);
      setDenoise(false);
      setRemoveBg(false);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        setPreview(src);
        const img = new window.Image();
        img.onload = () => setImageInfo({ width: img.naturalWidth, height: img.naturalHeight, size: selected.size });
        img.src = src;
      };
      reader.readAsDataURL(selected);
  };

  // 第一步：仅预处理
  // 裁剪图片辅助函数
  const cropImage = useCallback((img: HTMLImageElement, area: { left: number; top: number; width: number; height: number }) => {
    const canvas = document.createElement('canvas');
    canvas.width = area.width;
    canvas.height = area.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, area.left, area.top, area.width, area.height, 0, 0, area.width, area.height);
    return canvas;
  }, []);

  const handlePreprocess = async () => {
    if (!file) {
      toast.error(t('perler.upload_first'));
      return;
    }
    setLoading(true);
    try {
      const img = new window.Image();
      img.src = preview!;
      await new Promise((resolve) => { img.onload = resolve; });

      // 应用裁剪
      const sourceCanvas = cropArea ? cropImage(img, cropArea) : null;
      const sourceImg = sourceCanvas ? new window.Image() : img;
      if (sourceCanvas) {
        sourceImg.src = sourceCanvas.toDataURL('image/png');
        await new Promise((resolve) => { sourceImg.onload = resolve; });
      }

      const result = preprocessImageOnly(sourceImg, {
        brightness,
        contrast,
        saturation,
        colorTemperature,
        sharpen,
        denoise,
        removeBackground: removeBg,
      });

      setPreprocessedResult(result);
      setPreprocessedPreview(result.canvas.toDataURL('image/png'));
      // 生成原始线稿预览（阶段一）
      try {
        const sketch = generateSketch(sourceImg, 1);
        setSketchPreviewOriginal(sketch.canvas.toDataURL('image/png'));
      } catch {}
      toast.success(t('perler.preprocess_done'));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 第二步：生成图纸
  const handleSubmit = async () => {
    if (!file) {
      toast.error(t('perler.upload_first'));
      return;
    }
    setLoading(true);
    try {
      const img = new window.Image();
      img.src = preview!;
      await new Promise((resolve) => { img.onload = resolve; });

      // 应用裁剪
      const sourceCanvas = cropArea ? cropImage(img, cropArea) : null;
      const sourceImg = sourceCanvas ? new window.Image() : img;
      if (sourceCanvas) {
        sourceImg.src = sourceCanvas.toDataURL('image/png');
        await new Promise((resolve) => { sourceImg.onload = resolve; });
      }

      const { canvas, stats: patternStats, preprocessedCanvas, gridWidth, gridHeight, grid: patternGrid, cellSize: cs, padding: pd } = generatePerlerPattern(sourceImg, {
        gridSize,
        gridMode: [29, 58, 100].includes(gridSize) ? 'maxEdge' : 'height',
        palette,
        hollowCircle,
        mergeSimilar,
        removeBackground,
        pixelMode,
        dithering,
        colorDistance,
        preprocess: {
          brightness,
          contrast,
          saturation,
          colorTemperature,
          sharpen,
          denoise,
          removeBackground: removeBg,
        },
        excludedColors,
      }, preprocessedResult ?? undefined);

      setResult(canvas.toDataURL('image/png'));
      setStats(patternStats);
      setActualGridSize({ width: gridWidth, height: gridHeight });
      setCellSize(cs);
      setPadding(pd);
      setPanX(0);
      setPanY(0);
      setResultPreview(preprocessedCanvas?.toDataURL('image/png') ?? null);
      // 生成线稿缩放预览（阶段二）
      try {
        const sketch = generateSketch(sourceImg, 1);
        setSketchPreviewScaled(sketch.canvas.toDataURL('image/png'));
        setSketchGridSize({ w: gridWidth, h: gridHeight });
      } catch {}
      // 保存网格数据并计算颜色统计
      setGrid(patternGrid);
      const statsList = getColorStats(patternGrid, palette);
      setColorStats(statsList);
      toast.success(t('perler.success'));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = 'perler-pattern.png';
    a.click();
  };

  const shoppingList = stats ? generateShoppingList(stats, palette) : [];

  // 从网格数据重新渲染 Canvas
  const renderGridToCanvas = (g: string[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gridH = g.length;
    const gridW = g[0]?.length || 0;
    const cw = cellSize;
    const pd = padding;
    canvas.width = gridW * cw + pd * 2;
    canvas.height = gridH * cw + pd * 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const paletteColors = PALETTES[palette] || PALETTES.mard221;
    const colorMap = new Map<string, {hex: string}>();
    for (const c of paletteColors) colorMap.set(c.id, c);
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const colorId = g[y][x];
        if (colorId === 'BG') continue;
        const color = colorMap.get(colorId);
        if (!color) continue;
        const cx = pd + x * cw + cw / 2;
        const cy = pd + y * cw + cw / 2;
        const outerR = cw / 2 - 1;
        if (hollowCircle) {
          const innerR = outerR * 0.4;
          ctx.beginPath();
          ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
          ctx.fillStyle = color.hex;
          ctx.fill();
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
          ctx.fillStyle = color.hex;
          ctx.fill();
          ctx.strokeStyle = '#cccccc';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        const [rr, gg, bb] = hexToRgb(color.hex);
        const brightness = (rr * 299 + gg * 587 + bb * 114) / 1000;
        ctx.fillStyle = brightness > 128 ? '#000000' : '#ffffff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(colorId, cx, cy);
      }
    }
  };

  // 点击图纸编辑单个像素
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editMode || !grid) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor((mx - padding) / cellSize);
    const row = Math.floor((my - padding) / cellSize);
    if (row < 0 || row >= grid.length || col < 0 || col >= (grid[0]?.length || 0)) return;
    if (!editColor) {
      toast.error(t('perler.select_color_first'));
      return;
    }
    const result = paintPixel(grid, row, col, editColor);
    if (result.changed) {
      setGrid(result.grid);
      renderGridToCanvas(result.grid);
      setResult(canvas.toDataURL('image/png'));
      const statsList = getColorStats(result.grid, palette);
      setColorStats(statsList);
      setStats(statsList.reduce((acc, s) => ({ ...acc, [s.colorId]: s.count }), {} as Record<string, number>));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* 左侧：配置 */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('perler.upload_image')}</CardTitle>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="space-y-2">
                <CropSelector
                  imageSrc={preview}
                  onCropChange={setCropArea}
                />
                {imageInfo && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>{imageInfo.width} × {imageInfo.height}</span>
                    <span>{(imageInfo.size / 1024).toFixed(0)} KB</span>
                  </div>
                )}
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-2 border border-dashed rounded-lg transition-colors hover:bg-muted/50"
                  onClick={() => fileRef.current?.click()}
                >
                  {t('perler.restart')}
                </button>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) processFile(f);
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('perler.click_to_upload')}</p>
                  <p className="text-xs text-muted-foreground/60">{t('perler.supported_formats')} · {t('perler.paste_hint')}</p>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </CardContent>
        </Card>

                <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎨 {t('perler.stage1_preprocess')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
{/* 预处理参数 */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="h-4 w-4" />
                <Label className="font-medium">{t('perler.preprocess')}</Label>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs">{t('perler.brightness')}</Label>
                    <input type="number" min={-100} max={100} value={brightness} onChange={(e) => setBrightness(Math.max(-100, Math.min(100, Number(e.target.value) || 0)))} className="w-14 h-6 text-xs text-right text-muted-foreground bg-transparent border rounded px-1" />
                  </div>
                  <input type="range" min={-100} max={100} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs">{t('perler.contrast')}</Label>
                    <input type="number" min={-100} max={100} value={contrast} onChange={(e) => setContrast(Math.max(-100, Math.min(100, Number(e.target.value) || 0)))} className="w-14 h-6 text-xs text-right text-muted-foreground bg-transparent border rounded px-1" />
                  </div>
                  <input type="range" min={-100} max={100} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <Label className="text-xs">{t('perler.saturation')}</Label>
                    <input type="number" min={-100} max={100} value={saturation} onChange={(e) => setSaturation(Math.max(-100, Math.min(100, Number(e.target.value) || 0)))} className="w-14 h-6 text-xs text-right text-muted-foreground bg-transparent border rounded px-1" />
                  </div>
                  <input type="range" min={-100} max={100} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-xs">{t('perler.color_temperature')}</Label>
                    <input type="number" min={-100} max={100} value={colorTemperature} onChange={(e) => setColorTemperature(Math.max(-100, Math.min(100, Number(e.target.value) || 0)))} className="w-14 h-6 text-xs text-right text-muted-foreground bg-transparent border rounded px-1" />
                  </div>
                  <input type="range" min={-100} max={100} value={colorTemperature} onChange={(e) => setColorTemperature(Number(e.target.value))} className="w-full h-1.5" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('perler.sharpen')}</Label>
                  <Switch checked={sharpen} onCheckedChange={setSharpen} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('perler.denoise')}</Label>
                  <Switch checked={denoise} onCheckedChange={setDenoise} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('perler.remove_bg')}</Label>
                  <Switch checked={removeBg} onCheckedChange={setRemoveBg} />
                </div>
              </div>
            </div>
            {/* 预处理按钮 */}
            {!preprocessedPreview && (
              <Button onClick={handlePreprocess} disabled={loading || !file} className="w-full" variant="outline">
                {loading ? t('perler.processing') : t('perler.preprocess_btn')}
              </Button>
            )}
                        {/* 预处理结果（并排） */}
            {(preprocessedPreview || sketchPreviewOriginal) && (
              <div className="grid grid-cols-2 gap-3">
                {preprocessedPreview && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center font-medium">{t('perler.preprocess_done')}</p>
                    <div className="rounded-lg border overflow-hidden">
                      <img src={preprocessedPreview} alt={t("perler.preprocessed")} className="w-full h-auto" />
                    </div>
                  </div>
                )}
                {sketchPreviewOriginal && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground text-center font-medium">{t('perler.line_art.original_title')}</p>
                    <div className="rounded border overflow-hidden bg-white">
                      <img src={sketchPreviewOriginal} alt={t('perler.line_art.original_title')} className="w-full h-auto" />
                    </div>
                  </div>
                )}
              </div>
            )}
            {preprocessedPreview && (
              <div className="flex gap-2">
                <Button onClick={handlePreprocess} disabled={loading} className="flex-1" variant="outline" size="sm">
                  {t('perler.adjust_preprocess')}
                </Button>
                <Button onClick={() => { setPreprocessedPreview(null); setPreprocessedResult(null); setSketchPreviewOriginal(null); }} variant="outline" size="sm">
                  {t('perler.restart')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🧩 {t('perler.stage2_pattern')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('perler.grid_size')}</Label>
              <Select value={[29, 58, 100].includes(gridSize) ? String(gridSize) : 'custom'} onValueChange={(v) => { if (v === 'custom') { setGridSize(40); } else { setGridSize(Number(v || 29)); } }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="29">29 ({t('perler.standard')})</SelectItem>
                  <SelectItem value="58">58 ({t('perler.large')})</SelectItem>
                  <SelectItem value="100">100 ({t('perler.xlarge')})</SelectItem>
                  <SelectItem value="custom">{t('perler.custom')}</SelectItem>
                </SelectContent>
              </Select>
              {![29, 58, 100].includes(gridSize) && (
                <div className="flex items-center gap-2 mt-2">
                  <Label className="text-xs">{t('perler.height')}</Label>
                  <input type="text" inputMode="numeric" defaultValue={gridSize} onBlur={(e) => setGridSize(Math.max(3, Math.min(300, Number(e.target.value) || 3)))} onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }} className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm" />
                  <span className="text-xs text-muted-foreground">{t('perler.grid_unit')}</span>
                </div>
              )}
            </div>
            <div>
              <Label>{t('perler.palette')}</Label>
              <Select value={palette} onValueChange={(v) => setPalette(v || 'mard221')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(PALETTES).map(key => (
                    <SelectItem key={key} value={key}>
                      {PALETTE_NAMES[key]?.[locale] || PALETTE_NAMES[key]?.en || key}（{PALETTES[key].length} {t('perler.colors')}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Label>{t('perler.dithering')}</Label>
                <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs text-sm">{t('term.floyd_steinberg')}</p></TooltipContent></Tooltip></TooltipProvider>
              </div>
              <Switch checked={dithering} onCheckedChange={setDithering} />
            </div>
            <div>
              <Label>{t('perler.pixel_mode')}</Label>
              <Select value={pixelMode} onValueChange={(v) => setPixelMode(v as 'dominant' | 'average' | 'smart')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dominant">{t('perler.mode_dominant')}</SelectItem>
                  <SelectItem value="average">{t('perler.mode_average')}</SelectItem>
                  <SelectItem value="smart">{t('perler.mode_smart') || '智能取色（推荐）'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('perler.color_distance')}</Label>
              <Select value={colorDistance} onValueChange={(v) => setColorDistance(v as 'oklab' | 'rgb' | 'ciede2000')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oklab">{t('perler.dist_oklab')}</SelectItem>
                  <SelectItem value="rgb">{t('perler.dist_rgb')}</SelectItem>
                  <SelectItem value="ciede2000">{t('perler.dist_ciede2000')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('perler.merge_similar')}</Label>
              <Switch checked={mergeSimilar} onCheckedChange={setMergeSimilar} />
            </div>
          </CardContent>
        </Card>

        
        {/* 预览图并排 */}
        {(preprocessedPreview || resultPreview) && (
          <div className="grid grid-cols-2 gap-3">
            {preprocessedPreview && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t('perler.preprocessed') || '预处理后'}</p>
                <div className="rounded border overflow-hidden bg-white">
                  <img src={preprocessedPreview} alt={t("perler.preprocessed")} className="w-full h-auto" style={{imageRendering: 'pixelated'}} />
                </div>
              </div>
            )}
            {resultPreview && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{t('perler.pattern_preview') || '图纸预览'}</p>
                <div className="rounded border overflow-hidden bg-white">
                  <img src={resultPreview} alt={t("perler.pattern_preview") || "图纸预览"} className="w-full h-auto" style={{imageRendering: 'pixelated'}} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 生成按钮 */}
        {!result && preprocessedPreview && (
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? t('perler.generating') : (t('perler.generate') || '生成图纸')}
          </Button>
        )}
        {!result && !preprocessedPreview && (
          <p className="text-xs text-muted-foreground text-center">{t('perler.stage1.hint') || '请先完成预处理'}</p>
        )}
        {result && (
          <Button onClick={handleSubmit} disabled={loading} className="w-full" variant="outline" size="sm">
            {loading ? t('perler.generating') : (t('perler.regenerate') || '重新生成')}
          </Button>
        )}
      </div>

      {/* 右侧：结果 */}
      <div className="lg:col-span-3 space-y-4">
{/* 采购清单 */}
        {shoppingList.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => { setShoppingExpanded(!shoppingExpanded); if (shoppingExpanded) setShowAllShopping(false); }}
            >
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {t('perler.shopping_list')}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({shoppingList.reduce((sum, { count }) => sum + count, 0)} {t('perler.beads')})
                  </span>
                </div>
                {shoppingExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            {shoppingExpanded && (
              <CardContent>
                <div className="space-y-2">
                  {(showAllShopping ? shoppingList : shoppingList.slice(0, 5)).map(({ color, count }) => (
                    <div key={color.id} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded border" style={{ backgroundColor: color.hex }} />
                      <span className="flex-1">{color.name}（{color.id}）</span>
                      <span className="text-muted-foreground">{count} {t('perler.beads')}</span>
                    </div>
                  ))}
                  {shoppingList.length > 5 && !showAllShopping && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={(e) => { e.stopPropagation(); setShowAllShopping(true); }}
                    >
                      {t('perler.view_more') || '查看更多'} ({shoppingList.length - 5})
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 颜色统计 */}
        {colorStats.length > 0 && (
          <Card>
            <CardHeader className="cursor-pointer select-none" onClick={() => setStatsExpanded(!statsExpanded)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('perler.color_stats') || '颜色统计'}
                  <span className="text-sm font-normal text-muted-foreground">({t('perler.color_count').replace('{count}', String(colorStats.length))})</span>
                  {statsExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" /> : <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => {
                    const csv = [[t('perler.table.id') || '色号', t('perler.table.color') || '颜色', t('perler.table.count') || '数量', t('perler.table.ratio') || '占比'].join(',')].concat(
                      colorStats.map(s => `${s.colorId},${s.hex},${s.count},${s.percentage}%`)
                    ).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'perler-stats.csv'; a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {statsExpanded && (
              <CardContent>
              {/* 表格视图 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-1.5 pr-2">{t("perler.table.id") || "色号"}</th>
                      <th className="text-left py-1.5 pr-2">{t("perler.table.color") || "颜色"}</th>
                      <th className="text-right py-1.5 pr-2">{t("perler.table.count") || "数量"}</th>
                      <th className="text-right py-1.5 w-32">{t("perler.table.ratio") || "占比"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colorStats.map(({ colorId, hex, count, percentage }) => (
                      <tr key={colorId} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="py-1.5 pr-2 font-mono text-xs">{colorId}</td>
                        <td className="py-1.5 pr-2">
                          <div className="w-5 h-5 rounded border" style={{ backgroundColor: hex }} />
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono">{count}</td>
                        <td className="py-1.5 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, percentage)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 颜色排除 */}
        {result && (
          <Card>
            <CardHeader className="cursor-pointer select-none" onClick={() => setExcludeExpanded(!excludeExpanded)}>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('perler.color_exclude') || '颜色排除'}
                </div>
                {excludeExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            {excludeExpanded && (
              <CardContent>
              <p className="text-xs text-muted-foreground mb-3">{t('perler.exclude_hint') || '勾选不想使用的颜色，重新生成图纸'}</p>
              <div className="grid grid-cols-4 gap-2">
                {PALETTES[palette]?.map(color => (
                  <label
                    key={color.id}
                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={excludedColors.includes(color.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExcludedColors([...excludedColors, color.id]);
                        } else {
                          setExcludedColors(excludedColors.filter(id => id !== color.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: color.hex }} />
                    <span>{color.id}</span>
                  </label>
                ))}
              </div>
              </CardContent>
            )}
          </Card>
        )}

        <Card className="sticky top-6">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{t('perler.result')}</CardTitle>
                  {actualGridSize && (
                    <span className="text-xs text-muted-foreground">{actualGridSize.width} × {actualGridSize.height}</span>
                  )}
                </div>
                {result && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      {t('perler.download')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      {editMode ? (t('perler.exit_edit') || '退出编辑') : (t('perler.edit_mode') || '编辑')}
                    </Button>
                  </div>
                )}
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="range"
                    min={25}
                    max={1000}
                    value={Math.round(zoom * 100)}
                    onChange={(e) => setZoom(Number(e.target.value) / 100)}
                    className="w-full h-1.5 accent-primary cursor-pointer"
                  />
                  <ZoomIn className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{Math.round(zoom * 100)}%</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-3">
                {/* 最终图纸 */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">{t('perler.pattern') || '拼豆图纸'}</p>
                  {editMode && (
                    <div className="flex flex-wrap gap-1 mb-2 p-2 bg-muted/30 rounded-lg">
                      {PALETTES[palette]?.map(color => (
                        <button
                          key={color.id}
                          className={`w-6 h-6 rounded border-2 transition-all ${editColor === color.id ? 'border-primary ring-2 ring-primary scale-110' : 'border-muted hover:scale-105'}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.id}
                          onClick={() => setEditColor(color.id)}
                        />
                      ))}
                    </div>
                  )}
                  <div
                    ref={resultContainerRef}
                    className="overflow-hidden border rounded-lg bg-white touch-none"
                    style={{ maxHeight: '70vh', cursor: 'grab' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <div style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: 'top left', width: 'fit-content' }}>
                      <canvas
                        ref={canvasRef}
                        style={{ cursor: editMode ? 'crosshair' : 'default', display: 'block' }}
                        onClick={editMode ? handleCanvasClick : undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                <p>{t('perler.placeholder')}</p>
                <p className="text-sm mt-1">{t('perler.supported_formats')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
