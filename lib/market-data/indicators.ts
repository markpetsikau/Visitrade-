// ─────────────────────────────────────────────────────────────
// Technical indicators — computed from a real price series.
//
// This is the "Data Processing → Technical / Statistical Analysis"
// layer of the VISITRADE pipeline. A live provider hands us a raw
// close series; these functions derive the structured metrics the
// AI engine and the UI consume (RSI, volatility, momentum, trend).
// ─────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Wilder-style RSI over the last `period` deltas of a close series (0..100). */
export function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const recent = closes.slice(-(period + 1));
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < recent.length; i++) {
    const d = recent[i] - recent[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  const avgGain = gain / period;
  const avgLoss = loss / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(clamp(100 - 100 / (1 + rs), 0, 100));
}

/**
 * Annualized volatility (%) from a close series, assuming hourly samples
 * (CoinGecko 7d sparkline ≈ hourly). Falls back gracefully on short series.
 */
export function computeVolatility(closes: number[], samplesPerYear = 24 * 365): number {
  if (closes.length < 3) return 0;
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) rets.push(closes[i] / closes[i - 1] - 1);
  }
  if (!rets.length) return 0;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  const stdev = Math.sqrt(variance);
  const annualized = stdev * Math.sqrt(samplesPerYear) * 100;
  return Math.round(clamp(annualized, 0, 300));
}

/** Momentum in -100..100 from 7d change and RSI. */
export function computeMomentum(changePct7d: number, rsi: number): number {
  return Math.round(clamp(changePct7d * 3 + (rsi - 50), -100, 100));
}

/** Trend strength 0..100 from 7d change and RSI. */
export function computeTrendStrength(changePct7d: number, rsi: number): number {
  return Math.round(clamp(50 + changePct7d * 2 + (rsi - 50) * 0.4, 0, 100));
}

/** Simple moving average of the last `period` values. */
export function sma(series: number[], period: number): number | null {
  if (series.length < period) return null;
  const slice = series.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Full EMA series (for MACD). */
export function emaSeries(series: number[], period: number): number[] {
  if (series.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [series[0]];
  for (let i = 1; i < series.length; i++) {
    out.push(series[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

/** MACD (12,26,9) — latest values. */
export function macd(series: number[]): { macd: number; signal: number; hist: number } | null {
  if (series.length < 35) return null;
  const e12 = emaSeries(series, 12);
  const e26 = emaSeries(series, 26);
  const macdLine = series.map((_, i) => e12[i] - e26[i]);
  const signalLine = emaSeries(macdLine, 9);
  const m = macdLine[macdLine.length - 1];
  const s = signalLine[signalLine.length - 1];
  return { macd: m, signal: s, hist: m - s };
}

/**
 * Key levels from real swing pivots. Finds local extrema with a lookback
 * window, clusters nearby ones, and returns the closest supports/resistances
 * relative to the current price.
 */
export function findLevels(
  series: number[],
  price: number,
): { supports: number[]; resistances: number[] } {
  const w = 3;
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = w; i < series.length - w; i++) {
    const seg = series.slice(i - w, i + w + 1);
    const v = series[i];
    if (v === Math.max(...seg)) highs.push(v);
    if (v === Math.min(...seg)) lows.push(v);
  }
  const cluster = (arr: number[]) => {
    const sorted = [...new Set(arr.map((v) => Number(v.toFixed(price < 1 ? 5 : 2))))].sort(
      (a, b) => a - b,
    );
    const merged: number[] = [];
    for (const v of sorted) {
      if (!merged.length || Math.abs(v - merged[merged.length - 1]) / v > 0.012) {
        merged.push(v);
      }
    }
    return merged;
  };
  const supports = cluster(lows)
    .filter((v) => v < price)
    .sort((a, b) => b - a)
    .slice(0, 2);
  const resistances = cluster(highs)
    .filter((v) => v > price)
    .sort((a, b) => a - b)
    .slice(0, 2);
  return { supports, resistances };
}

/** Trend structure over the recent series (higher highs / lower lows). */
export function trendStructure(series: number[]): "haussière" | "baissière" | "range" {
  if (series.length < 10) return "range";
  const n = series.length;
  const firstHalf = series.slice(0, Math.floor(n / 2));
  const secondHalf = series.slice(Math.floor(n / 2));
  const maxA = Math.max(...firstHalf);
  const maxB = Math.max(...secondHalf);
  const minA = Math.min(...firstHalf);
  const minB = Math.min(...secondHalf);
  if (maxB > maxA && minB > minA) return "haussière";
  if (maxB < maxA && minB < minA) return "baissière";
  return "range";
}

/** Downsample a long series to ~n points for a clean sparkline. */
export function downsample(series: number[], n = 40): number[] {
  if (series.length <= n) return series;
  const step = series.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(series[Math.floor(i * step)]);
  out.push(series[series.length - 1]);
  return out;
}
