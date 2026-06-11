import { NextRequest } from 'next/server';

interface VisualizationBody {
  data: string; // CSV or JSON string
  chartType: string; // bar, line, scatter, boxplot, pie
  title?: string;
  xLabel?: string;
  yLabel?: string;
  config?: Record<string, unknown>;
}

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

const COLORS = [
  'rgba(59, 130, 246, 0.7)',   // blue
  'rgba(239, 68, 68, 0.7)',    // red
  'rgba(34, 197, 94, 0.7)',    // green
  'rgba(168, 85, 247, 0.7)',   // purple
  'rgba(249, 115, 22, 0.7)',   // orange
  'rgba(236, 72, 153, 0.7)',   // pink
  'rgba(20, 184, 166, 0.7)',   // teal
  'rgba(245, 158, 11, 0.7)',   // amber
];

const BORDER_COLORS = COLORS.map(c => c.replace('0.7', '1'));

function parseData(dataStr: string): { headers: string[]; rows: string[][] } {
  const trimmed = dataStr.trim();

  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const headers = Object.keys(parsed[0]);
      const rows = parsed.map(obj => headers.map(h => String(obj[h] ?? '')));
      return { headers, rows };
    }
  } catch {
    // Not JSON, try CSV
  }

  // CSV parsing
  const lines = trimmed.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line =>
    line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  return { headers, rows };
}

function buildChartConfig(body: VisualizationBody): ChartConfig {
  const { headers, rows } = parseData(body.data);
  const title = body.title || 'Data Visualization';

  if (headers.length === 0 || rows.length === 0) {
    return {
      type: 'bar',
      data: { labels: ['No Data'], datasets: [{ label: 'Error', data: [0] }] },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: 'No valid data provided' }, legend: { display: false } },
      },
    };
  }

  const labels = rows.map(r => r[0] || '');
  const numericCols: { index: number; name: string }[] = [];

  for (let i = 1; i < headers.length; i++) {
    const hasNumeric = rows.some(r => !isNaN(parseFloat(r[i])));
    if (hasNumeric) numericCols.push({ index: i, name: headers[i] });
  }

  if (numericCols.length === 0) {
    // Count frequencies of the first column
    const freq: Record<string, number> = {};
    for (const row of rows) {
      const key = row[0] || 'Unknown';
      freq[key] = (freq[key] || 0) + 1;
    }
    const freqLabels = Object.keys(freq);
    const freqData = Object.values(freq);

    return {
      type: body.chartType === 'pie' ? 'pie' : 'bar',
      data: {
        labels: freqLabels,
        datasets: [{
          label: 'Count',
          data: freqData,
          backgroundColor: freqLabels.map((_, i) => COLORS[i % COLORS.length]),
          borderColor: freqLabels.map((_, i) => BORDER_COLORS[i % BORDER_COLORS.length]),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: title }, legend: { display: body.chartType === 'pie' } },
        ...(body.chartType !== 'pie' ? { scales: { y: { beginAtZero: true } } } : {}),
      },
    };
  }

  const datasets = numericCols.map((col, di) => {
    const data = rows.map(r => parseFloat(r[col.index]) || 0);
    const isLine = body.chartType === 'line';
    const isPie = body.chartType === 'pie';

    return {
      label: col.name,
      data: isPie ? data.slice(0, 8) : data,
      backgroundColor: isPie
        ? data.map((_, i) => COLORS[i % COLORS.length])
        : COLORS[di % COLORS.length],
      borderColor: isPie
        ? data.map((_, i) => BORDER_COLORS[i % BORDER_COLORS.length])
        : BORDER_COLORS[di % BORDER_COLORS.length],
      borderWidth: 1,
      fill: isLine ? false : undefined,
      tension: isLine ? 0.3 : undefined,
    };
  });

  const chartType = body.chartType === 'boxplot' ? 'bar' : body.chartType;

  return {
    type: chartType,
    data: {
      labels: body.chartType === 'pie' ? labels.slice(0, 8) : labels,
      datasets,
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: title },
        legend: { display: numericCols.length > 1 || body.chartType === 'pie' },
      },
      ...(body.chartType !== 'pie' ? {
        scales: {
          x: body.xLabel ? { title: { display: true, text: body.xLabel } } : {},
          y: {
            beginAtZero: true,
            ...(body.yLabel ? { title: { display: true, text: body.yLabel } } : {}),
          },
        },
      } : {}),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: VisualizationBody = await req.json();

    if (!body.data || typeof body.data !== 'string' || body.data.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const validChartTypes = ['bar', 'line', 'scatter', 'boxplot', 'pie'];
    if (!validChartTypes.includes(body.chartType)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid chart type. Supported: ${validChartTypes.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const chartConfig = buildChartConfig(body);

    return new Response(
      JSON.stringify({ success: true, data: chartConfig }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
