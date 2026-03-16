import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { fetchCrudePrices, type CrudePriceData } from '../api/client';

const RANGES = [
  { label: '1T', value: '5d' },
  { label: '1Th', value: '1mo' },
  { label: '3Th', value: '3mo' },
  { label: '6Th', value: '6mo' },
  { label: '1N', value: '1y' },
] as const;

const SYMBOLS = [
  { label: 'WTI', value: 'CL=F' },
  { label: 'Brent', value: 'BZ=F' },
] as const;

function formatDate(iso: string, range: string): string {
  const d = new Date(iso);
  if (range === '5d') return format(d, 'EEE HH:mm', { locale: vi });
  if (range === '1mo') return format(d, 'dd/MM');
  return format(d, 'dd/MM/yy');
}

function formatTooltipDate(iso: string, range: string): string {
  const d = new Date(iso);
  if (range === '5d' || range === '1mo') return format(d, 'dd/MM HH:mm');
  return format(d, 'dd/MM/yy');
}

export default function PriceChart() {
  const [range, setRange] = useState('1mo');
  const [symbol, setSymbol] = useState('CL=F');
  const [data, setData] = useState<CrudePriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCrudePrices(range, symbol).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [range, symbol]);

  const change = data && data.previousClose
    ? data.currentPrice - data.previousClose
    : 0;
  const changePct = data && data.previousClose
    ? (change / data.previousClose) * 100
    : 0;
  // Daily change direction (for the change text)
  const isPositive = data && data.previousClose ? change >= 0 : true;
  // Visible trend direction (for chart line/gradient color)
  const trendPositive = (data?.prices?.length ?? 0) >= 2
    ? data!.prices[data!.prices.length - 1].price >= data!.prices[0].price
    : true;

  const chartData = data?.prices.map((p) => ({
    date: formatDate(p.date, range),
    price: p.price,
    fullDate: p.date,
  })) ?? [];

  const prices = chartData.map((d) => d.price);
  const minPrice = prices.length ? Math.floor(Math.min(...prices) * 0.998) : 0;
  const maxPrice = prices.length ? Math.ceil(Math.max(...prices) * 1.002) : 100;

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-baseline gap-3">
          {/* Symbol toggle */}
          <div className="flex gap-1">
            {SYMBOLS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSymbol(s.value)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  symbol === s.value
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {data && !loading && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                ${data.currentPrice.toFixed(2)}
              </span>
              {data.previousClose > 0 && (
                <span className={`text-sm font-medium tabular-nums ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePct.toFixed(2)}%)
                </span>
              )}
            </div>
          )}
        </div>
        {/* Range toggle */}
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                range === r.value
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        {loading ? (
          <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 rounded animate-pulse" />
        ) : !data || chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
            Không có dữ liệu
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trendPositive ? '#059669' : '#dc2626'} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={trendPositive ? '#059669' : '#dc2626'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-neutral-900, #171717)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#e5e5e5',
                  padding: '6px 10px',
                }}
                formatter={(value: unknown) => [`$${Number(value).toFixed(2)}`, 'Giá']}
                labelFormatter={(_label, payload) => {
                  const fullDate = (payload as any)?.[0]?.payload?.fullDate;
                  if (!fullDate) return String(_label);
                  return formatTooltipDate(fullDate, range);
                }}
              />
              <Area
                type="linear"
                dataKey="price"
                stroke={trendPositive ? '#059669' : '#dc2626'}
                strokeWidth={1}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
