'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import {
  BarChart,
  Loader2,
  AlertCircle,
  Upload,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface ChartConfig {
  type: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
    }>;
  };
  options: {
    responsive: boolean;
    plugins: {
      title: { display: boolean; text: string };
      legend: { display: boolean };
    };
    scales?: Record<string, unknown>;
  };
}

interface VisualizationStageProps {
  projectId: string;
  onSaved?: () => void;
}

const CHART_TYPES = [
  { key: 'bar', label: 'Bar Chart', icon: '📊' },
  { key: 'line', label: 'Line Chart', icon: '📈' },
  { key: 'scatter', label: 'Scatter Plot', icon: '⚬' },
  { key: 'pie', label: 'Pie Chart', icon: '🥧' },
  { key: 'boxplot', label: 'Box Plot', icon: '📦' },
] as const;

export function VisualizationStage({ projectId, onSaved }: VisualizationStageProps) {
  const { t } = useI18n();
  const [dataInput, setDataInput] = useState('');
  const [chartType, setChartType] = useState<string>('bar');
  const [title, setTitle] = useState('');
  const [xLabel, setXLabel] = useState('');
  const [yLabel, setYLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDataInput(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!dataInput.trim()) return;

    setGenerating(true);
    setError(null);
    setChartConfig(null);

    try {
      const res = await fetch(apiPath('/api/academic/visualization'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataInput,
          chartType,
          title: title || undefined,
          xLabel: xLabel || undefined,
          yLabel: yLabel || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Visualization failed');
      }
      setChartConfig(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Visualization failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart-${chartType}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderChart = (config: ChartConfig) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commonProps: any = {
      data: config.data,
      options: {
        ...config.options,
        maintainAspectRatio: true,
      },
    };

    switch (config.type) {
      case 'line':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'scatter':
        return <Scatter {...commonProps} />;
      case 'bar':
      default:
        return <Bar {...commonProps} />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.stage.visualization')}</CardTitle>
          </div>
          <CardDescription className="text-xs">{t('academic.stage.visualization_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('academic.visualization.data_input')}</Label>
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="h-6 text-xs px-2">
                <Upload className="h-3 w-3 mr-1" />
                {t('academic.visualization.upload_csv')}
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.json" onChange={handleFileUpload} className="hidden" />
            </div>
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              placeholder={t('academic.visualization.data_placeholder')}
              className="w-full h-28 p-3 rounded-lg border border-border bg-background text-sm font-mono resize-y"
            />
          </div>

          {/* Chart Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('academic.visualization.chart_type')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.key}
                  onClick={() => setChartType(ct.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    chartType === ct.key
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>{ct.icon}</span>
                  {ct.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.visualization.chart_title')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('academic.visualization.chart_title_placeholder')} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.visualization.x_label')}</Label>
              <Input value={xLabel} onChange={(e) => setXLabel(e.target.value)} placeholder={t('academic.visualization.x_label_placeholder')} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.visualization.y_label')}</Label>
              <Input value={yLabel} onChange={(e) => setYLabel(e.target.value)} placeholder={t('academic.visualization.y_label_placeholder')} className="h-8 text-xs" />
            </div>
          </div>

          {/* Generate */}
          <Button onClick={handleGenerate} disabled={!dataInput.trim() || generating} size="sm">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart className="h-4 w-4 mr-2" />}
            {t('academic.visualization.generate')}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {/* Chart Output */}
      {chartConfig && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('academic.visualization.chart_output')}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload} className="h-7 text-xs px-2">
                <Download className="h-3 w-3 mr-1" />
                {t('academic.visualization.download_png')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={chartRef} className="p-4 bg-white dark:bg-background rounded-lg border border-border/50">
              {renderChart(chartConfig)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
