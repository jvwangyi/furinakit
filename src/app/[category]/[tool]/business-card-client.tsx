'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

type TemplateStyle = 'minimal' | 'modern' | 'classic' | 'creative';

const TEMPLATES: Record<TemplateStyle, { bg: string; accent: string; textColor: string; subColor: string }> = {
  minimal: { bg: '#ffffff', accent: '#1a1a2e', textColor: '#1a1a2e', subColor: '#666' },
  modern: { bg: '#0f0f23', accent: '#00d4ff', textColor: '#ffffff', subColor: '#aaa' },
  classic: { bg: '#f5f0e8', accent: '#8b4513', textColor: '#2c1810', subColor: '#5c4033' },
  creative: { bg: '#1a1a2e', accent: '#e94560', textColor: '#eee', subColor: '#aaa' },
};

export function BusinessCardClient() {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [data, setData] = useState<CardData>({
    name: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  });

  const [template, setTemplate] = useState<TemplateStyle>('minimal');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const updateField = (field: keyof CardData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const generateCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard business card ratio: 3.5 x 2 inches at 300 DPI = 1050 x 600
    const w = 1050;
    const h = 600;
    canvas.width = w;
    canvas.height = h;

    const style = TEMPLATES[template];

    // Background
    ctx.fillStyle = style.bg;
    ctx.fillRect(0, 0, w, h);

    // Accent bar
    if (template === 'minimal') {
      ctx.fillStyle = style.accent;
      ctx.fillRect(0, 0, w, 6);
    } else if (template === 'modern') {
      // Gradient accent bar
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, style.accent);
      grad.addColorStop(1, '#7b2ff7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, 8);
      // Side accent
      ctx.fillStyle = style.accent;
      ctx.fillRect(0, 0, 6, h);
    } else if (template === 'classic') {
      ctx.strokeStyle = style.accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, w - 60, h - 60);
    } else if (template === 'creative') {
      // Diagonal accent
      ctx.fillStyle = style.accent;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(300, 0);
      ctx.lineTo(200, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    }

    const leftPad = template === 'creative' ? 340 : 60;
    const topStart = template === 'classic' ? 100 : 80;

    // Name
    ctx.fillStyle = template === 'creative' ? '#ffffff' : style.textColor;
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(data.name || t('business_card.placeholder.name'), leftPad, topStart + 48);

    // Title
    ctx.fillStyle = style.accent;
    ctx.font = '24px sans-serif';
    ctx.fillText(data.title || t('business_card.placeholder.title'), leftPad, topStart + 90);

    // Company
    ctx.fillStyle = template === 'creative' ? '#ffffff' : style.textColor;
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(data.company || t('business_card.placeholder.company'), leftPad, topStart + 135);

    // Divider
    ctx.strokeStyle = style.subColor + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, topStart + 160);
    ctx.lineTo(w - 60, topStart + 160);
    ctx.stroke();

    // Contact info
    ctx.fillStyle = style.subColor;
    ctx.font = '20px sans-serif';
    let y = topStart + 200;
    const lineH = 40;

    const iconText = (icon: string, text: string) => {
      ctx.fillText(`${icon}  ${text}`, leftPad, y);
      y += lineH;
    };

    if (data.phone) iconText('📞', data.phone);
    if (data.email) iconText('✉️', data.email);
    if (data.website) iconText('🌐', data.website);
    if (data.address) iconText('📍', data.address);

    // Update preview
    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [data, template, t]);

  const downloadCard = () => {
    if (!previewUrl) generateCard();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'business-card.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle>{t('business_card.form_title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('business_card.template')}</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as TemplateStyle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">{t('business_card.template_minimal')}</SelectItem>
                  <SelectItem value="modern">{t('business_card.template_modern')}</SelectItem>
                  <SelectItem value="classic">{t('business_card.template_classic')}</SelectItem>
                  <SelectItem value="creative">{t('business_card.template_creative')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(['name', 'title', 'company', 'phone', 'email', 'website', 'address'] as const).map(field => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`card-${field}`}>{t(`business_card.${field}`)}</Label>
                <Input
                  id={`card-${field}`}
                  value={data[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={t(`business_card.placeholder.${field}`)}
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button onClick={generateCard} className="flex-1">
                <Eye className="h-4 w-4 mr-2" /> {t('business_card.preview')}
              </Button>
              <Button onClick={downloadCard} variant="outline" className="flex-1" disabled={!previewUrl}>
                <Download className="h-4 w-4 mr-2" /> {t('btn.download')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle>{t('business_card.preview_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <div className="rounded-lg overflow-hidden border border-border/50 shadow-lg">
                <img src={previewUrl} alt="Business Card Preview" className="w-full" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground border border-dashed border-border/50 rounded-lg">
                <p>{t('business_card.empty_preview')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
