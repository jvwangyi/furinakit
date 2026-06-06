'use client';

import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropSelectorProps {
  imageSrc: string;
  onCropChange: (crop: { left: number; top: number; width: number; height: number }) => void;
}

export function CropSelector({ imageSrc, onCropChange }: CropSelectorProps) {
  const { t } = useI18n();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [targetW, setTargetW] = useState<number>(1);
  const [targetH, setTargetH] = useState<number>(1);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [cropPixels, setCropPixels] = useState<Area | null>(null);

  const handleMediaLoaded = useCallback((img: { naturalWidth: number; naturalHeight: number }) => {
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCropPixels(croppedAreaPixels);
      onCropChange({
        left: Math.round(croppedAreaPixels.x),
        top: Math.round(croppedAreaPixels.y),
        width: Math.round(croppedAreaPixels.width),
        height: Math.round(croppedAreaPixels.height),
      });
    },
    [onCropChange]
  );

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setTargetW(0);
    setTargetH(0);
  };

  // 计算 aspect：基于目标像素和图片实际尺寸
  const aspect = targetW > 0 && targetH > 0 ? targetW / targetH : undefined;

  // 用目标像素大小计算对应的缩放级别
  // react-easy-crop 的 crop 区域大小 = 容器大小 / zoom
  // 我们要让 crop 区域 = 目标像素大小（在图片坐标系中）
  // 需要根据容器大小和图片缩放比来算 zoom
  const calcZoomForTarget = (tw: number, th: number) => {
    if (naturalSize.w === 0 || naturalSize.h === 0 || tw === 0 || th === 0) return 1;
    // 图片在容器中的缩放比（假设容器宽 100%）
    // crop 区域在图片坐标系中的大小 = 容器大小 / zoom * (naturalSize / containerSize)
    // 简化：zoom = max(containerW / tw, containerH / th) 在图片坐标系中
    // 但 react-easy-crop 的 zoom 是相对于容器的
    // 实际上 zoom 越大，crop 区域越小
    // 让 crop 区域宽度 = tw: zoom = naturalSize.w / tw (近似)
    const fitZoom = Math.min(naturalSize.w / tw, naturalSize.h / th);
    return Math.max(1, Math.min(5, fitZoom));
  };

  const handleTargetChange = (dim: 'w' | 'h', val: string) => {
    const num = parseInt(val) || 0;
    if (dim === 'w') {
      setTargetW(num);
      if (num > 0 && targetH > 0) setZoom(calcZoomForTarget(num, targetH));
    } else {
      setTargetH(num);
      if (num > 0 && targetW > 0) setZoom(calcZoomForTarget(targetW, num));
    }
  };

  const presets = [
    { label: t('crop.free'), w: 0, h: 0 },
    { label: '1:1', w: 1, h: 1 },
    { label: '4:3', w: 4, h: 3 },
    { label: '3:4', w: 3, h: 4 },
    { label: '16:9', w: 16, h: 9 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{t('crop.drag_hint')}</Label>
        <button type="button" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={handleReset}>
          <RotateCcw className="h-3 w-3" /> {t('crop.reset')}
        </button>
      </div>

      {/* 预设比例 */}
      <div className="flex gap-1.5 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`px-2.5 py-1.5 text-xs rounded-md border font-medium transition-all duration-150 ${
              targetW === p.w && targetH === p.h
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border hover:bg-accent hover:border-border/80'
            }`}
            onClick={() => {
              setTargetW(p.w);
              setTargetH(p.h);
              if (p.w > 0 && p.h > 0 && naturalSize.w > 0) {
                // 用图片全尺寸作为基准
                const fitZoom = Math.min(naturalSize.w / p.w, naturalSize.h / p.h);
                setZoom(Math.max(1, Math.min(5, fitZoom)));
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 自定义像素 */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">{t('crop.size')}</Label>
        <input
          type="number"
          min={10}
          placeholder={t('crop.width')}
          value={targetW || ''}
          onChange={(e) => handleTargetChange('w', e.target.value)}
          className="w-20 h-7 text-xs rounded border border-input bg-background px-2"
        />
        <span className="text-xs text-muted-foreground">×</span>
        <input
          type="number"
          min={10}
          placeholder={t('crop.height')}
          value={targetH || ''}
          onChange={(e) => handleTargetChange('h', e.target.value)}
          className="w-20 h-7 text-xs rounded border border-input bg-background px-2"
        />
        <span className="text-xs text-muted-foreground">px</span>
      </div>

      {/* 当前裁剪尺寸 */}
      {cropPixels && (
        <div className="text-xs text-muted-foreground">
          {t('crop.current')}: {Math.round(cropPixels.width)} × {Math.round(cropPixels.height)} px
          {naturalSize.w > 0 && (
            <span className="ml-2">{t('crop.original')}: {naturalSize.w} × {naturalSize.h}</span>
          )}
        </div>
      )}

      {/* 裁剪区域 */}
      <div className="relative w-full h-80 rounded-lg overflow-hidden border border-border/50 bg-background">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          onMediaLoaded={handleMediaLoaded}
          cropShape="rect"
          showGrid={true}
        />
      </div>

      {/* 图片缩放 */}
      <div className="flex items-center gap-3">
        <Label className="text-xs whitespace-nowrap text-muted-foreground w-14">{t('crop.zoom')}</Label>
        <input type="range" min={1} max={5} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 h-1.5" />
        <span className="text-xs text-muted-foreground w-10 text-right">{zoom.toFixed(1)}x</span>
      </div>
    </div>
  );
}
