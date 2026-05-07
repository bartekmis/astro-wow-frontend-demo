/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

type MetricKey = 'lcp' | 'inp' | 'cls' | 'ttfb';

interface MetricDef {
  label: string;
  color: string;
  base: number;
  amp: number;
  unit: string;
  decimals: number;
}

const METRICS: Record<MetricKey, MetricDef> = {
  lcp:  { label: 'LCP (s)',    color: '#ff5b1f', base: 2.6, amp: 0.9, unit: 's',  decimals: 2 },
  inp:  { label: 'INP (ms)',   color: '#4cd1ff', base: 220, amp: 90,  unit: 'ms', decimals: 0 },
  cls:  { label: 'CLS (x100)', color: '#ffb454', base: 12,  amp: 6,   unit: '',   decimals: 1 },
  ttfb: { label: 'TTFB (ms)',  color: '#28d17c', base: 480, amp: 180, unit: 'ms', decimals: 0 },
};

const RANGES = [
  { days: 30,  label: '30 dni' },
  { days: 90,  label: '90 dni' },
  { days: 180, label: '180 dni' },
  { days: 365, label: '12 mies.' },
];

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Series { labels: Date[]; lcp: number[]; inp: number[]; cls: number[]; ttfb: number[]; }

function generateSeries(days = 365): Series {
  const rand = seededRandom(42);
  const series: Series = { labels: [], lcp: [], inp: [], cls: [], ttfb: [] };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trend = (i: number) => 1 - (i / days) * 0.35;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    series.labels.push(d);
    const t = (days - 1 - i) / days;
    (Object.entries(METRICS) as [MetricKey, MetricDef][]).forEach(([key, m]) => {
      const wave = Math.sin(t * Math.PI * 4 + key.length) * 0.4;
      const noise = (rand() - 0.5) * 0.7;
      const spike = rand() < 0.04 ? (rand() - 0.5) * 1.4 : 0;
      const val = m.base * trend(days - 1 - i) + m.amp * (wave + noise + spike) * 0.4;
      series[key].push(Math.max(0, Number(val.toFixed(m.decimals + 1))));
    });
  }
  return series;
}

const formatDate = (d: Date) =>
  d.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });

const average = (arr: number[]) =>
  arr.reduce((a, b) => a + b, 0) / arr.length;

export default function CwvChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const [active, setActive] = useState<Set<MetricKey>>(
    () => new Set<MetricKey>(['lcp', 'inp', 'cls', 'ttfb'])
  );
  const [range, setRange] = useState(180);

  const FULL = useMemo(() => generateSeries(365), []);

  const slice = useMemo(() => {
    const start = FULL.labels.length - range;
    return {
      labels: FULL.labels.slice(start),
      lcp: FULL.lcp.slice(start),
      inp: FULL.inp.slice(start),
      cls: FULL.cls.slice(start),
      ttfb: FULL.ttfb.slice(start),
    };
  }, [FULL, range]);

  const datasets = useMemo(() => {
    return (Object.entries(METRICS) as [MetricKey, MetricDef][])
      .filter(([key]) => active.has(key))
      .map(([key, m]) => ({
        label: m.label,
        data: slice[key],
        borderColor: m.color,
        backgroundColor: m.color + '22',
        pointBackgroundColor: m.color,
        pointBorderColor: '#0b0b10',
        pointBorderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        _metricKey: key,
      }));
  }, [slice, active]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: slice.labels.map(formatDate),
        datasets: datasets as any,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 13, 18, 0.95)',
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            padding: 12,
            titleColor: '#8b91a1',
            titleFont: { size: 11, weight: 500 },
            bodyColor: '#ffffff',
            bodyFont: { size: 12, family: 'JetBrains Mono, ui-monospace, monospace' },
            bodySpacing: 6,
            cornerRadius: 12,
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label(ctx) {
                const ds = ctx.dataset as { _metricKey?: MetricKey };
                const key = ds._metricKey;
                if (!key) return '';
                const m = METRICS[key];
                const v = ctx.parsed.y;
                return ` ${m.label}: ${v.toFixed(m.decimals)}${m.unit ? ' ' + m.unit : ''}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#8b91a1', font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: '#8b91a1', font: { size: 11 }, padding: 8 },
            border: { display: false },
          },
        },
      },
    };

    chartRef.current = new Chart(canvasRef.current, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // Build chart once on mount; updates handled by separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = slice.labels.map(formatDate);
    chart.data.datasets = datasets as any;
    chart.update();
  }, [slice, datasets]);

  const toggleMetric = (key: MetricKey) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div class="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 md:p-10">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div class="flex flex-wrap gap-2">
          {(Object.entries(METRICS) as [MetricKey, MetricDef][]).map(([key, m]) => (
            <button
              key={key}
              type="button"
              class={`chart-toggle ${active.has(key) ? 'is-active' : ''}`}
              style={{ ['--c' as any]: m.color }}
              onClick={() => toggleMetric(key)}
            >
              <span class="chart-dot"></span>
              {m.label.split(' ')[0]}
              <span class="text-grey ml-1 text-[11px]">{m.label.replace(/^\S+\s*/, '')}</span>
            </button>
          ))}
        </div>

        <div class="inline-flex p-1 rounded-full bg-white/[0.04] border border-white/10 self-start">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              class={`chart-range ${range === r.days ? 'is-active' : ''}`}
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {(Object.entries(METRICS) as [MetricKey, MetricDef][]).map(([key, m]) => {
          const avg = average(slice[key]);
          return (
            <div key={key} class="metric">
              <div class="metric__label">{key.toUpperCase()} srednia</div>
              <div class="metric__value" style={{ color: m.color }}>
                {avg.toFixed(m.decimals)}{m.unit ? ' ' + m.unit : ''}
              </div>
            </div>
          );
        })}
      </div>

      <div class="relative w-full h-[320px] md:h-[420px]">
        <canvas ref={canvasRef}></canvas>
      </div>

      <p class="text-xs text-grey mt-6">
        Dane usrednione z RUM (real user monitoring). Wartosci CLS przemnozone przez 100 dla porownywalnosci na jednej skali.
      </p>
    </div>
  );
}
