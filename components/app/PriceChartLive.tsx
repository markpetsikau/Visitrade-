"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { cn } from "@/lib/utils";

function movingAverage(
  candles: { time: number; close: number }[],
  period: number,
): { time: UTCTimestamp; value: number }[] {
  const out: { time: UTCTimestamp; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    out.push({ time: candles[i].time as UTCTimestamp, value: sum / period });
  }
  return out;
}

const RANGES = [
  { label: "1J", days: 1 },
  { label: "1S", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1A", days: 365 },
];

type Candle = { time: number; open: number; high: number; low: number; close: number };

export function PriceChartLive({ symbol, height = 340 }: { symbol: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ma50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  // Create the chart once.
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#95A3B8",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(30,40,54,0.6)" },
        horzLines: { color: "rgba(30,40,54,0.6)" },
      },
      rightPriceScale: { borderColor: "#1E2836" },
      timeScale: { borderColor: "#1E2836", timeVisible: true },
      crosshair: { mode: 1 },
      autoSize: true,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22C55E",
      downColor: "#F04452",
      borderVisible: false,
      wickUpColor: "#22C55E",
      wickDownColor: "#F04452",
    });
    const ma20 = chart.addSeries(LineSeries, { color: "#38BDF8", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ma50 = chart.addSeries(LineSeries, { color: "#A78BFA", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });

    chartRef.current = chart;
    seriesRef.current = series;
    ma20Ref.current = ma20;
    ma50Ref.current = ma50;

    // Re-fit bars whenever the container size changes (autoSize handles
    // width, but the bars need re-distributing to fill it).
    const ro = new ResizeObserver(() => {
      chart.timeScale().fitContent();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Load data on symbol / timeframe change.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setEmpty(false);
    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive || !seriesRef.current) return;
        const candles: Candle[] = (data.candles ?? [])
          .filter((c: Candle) => c && Number.isFinite(c.time))
          .sort((a: Candle, b: Candle) => a.time - b.time);
        // Dedupe timestamps (lightweight-charts requires strictly ascending).
        const seen = new Set<number>();
        const clean = candles.filter((c) => {
          if (seen.has(c.time)) return false;
          seen.add(c.time);
          return true;
        });
        if (clean.length === 0) {
          setEmpty(true);
        } else {
          seriesRef.current.setData(
            clean.map((c) => ({
              time: c.time as UTCTimestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            })),
          );
          // Moving averages (real analysis overlay).
          const closes = clean.map((c) => ({ time: c.time, close: c.close }));
          ma20Ref.current?.setData(clean.length >= 20 ? movingAverage(closes, 20) : []);
          ma50Ref.current?.setData(clean.length >= 50 ? movingAverage(closes, 50) : []);
          requestAnimationFrame(() => chartRef.current?.timeScale().fitContent());
        }
      })
      .catch(() => alive && setEmpty(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [symbol, days]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-surface/50 p-0.5 text-xs">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                days === r.days ? "bg-brand/15 text-brand" : "text-ink-muted hover:text-ink",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded bg-[#38BDF8]" /> MM20</span>
          <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded bg-[#A78BFA]" /> MM50</span>
          {loading && <span className="text-ink-faint">Chargement…</span>}
        </div>
      </div>
      <div className="relative" style={{ height }}>
        <div ref={containerRef} className="h-full w-full" />
        {empty && (
          <div className="absolute inset-0 grid place-items-center text-sm text-ink-faint">
            Données de graphique indisponibles pour cet actif.
          </div>
        )}
      </div>
    </div>
  );
}
