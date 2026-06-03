'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ColorPickerProps {
  /** Current color value */
  color: string;
  /** Callback when color changes */
  onColorChange?: (color: string) => void;
  /** Result string (for parsing colors from results) */
  result?: string;
}

// Predefined color palette
const PRESET_COLORS = [
  '#FF0000', '#FF5733', '#FFC300', '#DAF7A6', '#33FF57',
  '#33FFEC', '#337AFF', '#3333FF', '#8333FF', '#FF33EC',
  '#FF3333', '#C70039', '#900C3F', '#581845', '#2C3E50',
  '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6', '#34495E',
  '#F39C12', '#E74C3C', '#ECF0F1', '#BDC3C7', '#95A5A6',
  '#7F8C8D', '#000000', '#FFFFFF', '#F1C40F', '#16A085',
];

function parseColor(color: string): string | null {
  if (!color) return null;
  const trimmed = color.trim();

  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    // Expand 3-digit hex
    if (trimmed.length === 4) {
      return '#' + trimmed[1] + trimmed[1] + trimmed[2] + trimmed[2] + trimmed[3] + trimmed[3];
    }
    return trimmed;
  }

  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  const hslMatch = trimmed.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function ColorPicker({ color, onColorChange, result }: ColorPickerProps) {
  const { t } = useI18n();
  const [hexInput, setHexInput] = useState(color || '#ff5733');
  const [rgbInputs, setRgbInputs] = useState({ r: 255, g: 87, b: 51 });
  const [hslInputs, setHslInputs] = useState({ h: 11, s: 100, l: 60 });
  const nativeColorRef = useRef<HTMLInputElement>(null);
  const isInteractive = !!onColorChange;

  // Parse initial color or from result
  useEffect(() => {
    let hex = parseColor(color);
    if (!hex && result) {
      const hexMatch = result.match(/#[0-9a-fA-F]{3,8}/);
      if (hexMatch) hex = parseColor(hexMatch[0]);
      if (!hex) {
        const rgbMatch = result.match(/rgba?\([^)]+\)/);
        if (rgbMatch) hex = parseColor(rgbMatch[0]);
      }
      if (!hex) {
        const hslMatch = result.match(/hsl\([^)]+\)/);
        if (hslMatch) hex = parseColor(hslMatch[0]);
      }
    }
    if (hex) {
      setHexInput(hex);
      const rgb = hexToRgb(hex);
      if (rgb) {
        setRgbInputs(rgb);
        setHslInputs(rgbToHsl(rgb.r, rgb.g, rgb.b));
      }
    }
  }, [color, result]);

  const updateAll = useCallback((hex: string) => {
    setHexInput(hex);
    const rgb = hexToRgb(hex);
    if (rgb) {
      setRgbInputs(rgb);
      setHslInputs(rgbToHsl(rgb.r, rgb.g, rgb.b));
    }
    onColorChange?.(hex);
  }, [onColorChange]);

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      const rgb = hexToRgb(value);
      if (rgb) {
        setRgbInputs(rgb);
        setHslInputs(rgbToHsl(rgb.r, rgb.g, rgb.b));
      }
      onColorChange?.(value);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const num = Math.max(0, Math.min(255, parseInt(value) || 0));
    const newRgb = { ...rgbInputs, [channel]: num };
    setRgbInputs(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexInput(hex);
    setHslInputs(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    onColorChange?.(hex);
  };

  return (
    <Card className="bg-muted/30 border border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {isInteractive ? t('tool.color_picker') : t('tool.color_preview')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color preview and native picker */}
        <div className="flex items-center gap-3">
          <div
            className={`w-16 h-16 rounded-lg border-2 border-border shadow-sm flex items-center justify-center text-xs font-mono ${isInteractive ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            style={{
              backgroundColor: hexInput,
              color: getContrastColor(hexInput),
            }}
            onClick={() => isInteractive && nativeColorRef.current?.click()}
          >
            {hexInput.toUpperCase()}
          </div>
          {isInteractive && (
            <input
              ref={nativeColorRef}
              type="color"
              value={hexInput}
              onChange={(e) => updateAll(e.target.value)}
              className="w-0 h-0 opacity-0 absolute"
            />
          )}
          <div className="flex-1 space-y-1">
            <div className="text-sm font-mono">{hexInput.toUpperCase()}</div>
            <div className="text-xs text-muted-foreground">
              RGB({rgbInputs.r}, {rgbInputs.g}, {rgbInputs.b})
            </div>
            <div className="text-xs text-muted-foreground">
              HSL({hslInputs.h}°, {hslInputs.s}%, {hslInputs.l}%)
            </div>
          </div>
        </div>

        {/* Preset colors (interactive mode only) */}
        {isInteractive && (
          <div>
            <Label className="text-xs mb-2 block">{t('tool.preset_colors')}</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                    hexInput.toLowerCase() === presetColor.toLowerCase()
                      ? 'ring-2 ring-primary ring-offset-1'
                      : ''
                  }`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => updateAll(presetColor)}
                  title={presetColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* HEX input (interactive mode only) */}
        {isInteractive && (
          <>
            <div>
              <Label className="text-xs">HEX</Label>
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#ff5733"
                className="h-8 text-sm font-mono"
              />
            </div>

            {/* RGB inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">R</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbInputs.r}
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">G</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbInputs.g}
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">B</Label>
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbInputs.b}
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {/* Result display (read-only mode) */}
        {!isInteractive && result && (
          <>
            <p className="text-sm font-medium">{t('tool.result')}</p>
            <p className="text-xs text-muted-foreground font-mono break-all">{result}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
