// ─────────────────────────────────────────────────────────────
// VISITRADE — Domain types
// These types are provider-agnostic. A real market-data API only
// needs to satisfy these shapes for the whole app to keep working.
// ─────────────────────────────────────────────────────────────

export type AssetClass = "crypto" | "index" | "commodity" | "stock" | "forex";

export interface Asset {
  symbol: string; // e.g. "BTC"
  name: string; // e.g. "Bitcoin"
  class: AssetClass;
  image?: string; // logo URL (live crypto)
  id?: string; // provider id (e.g. CoinGecko id) for chart lookups
  price: number;
  changePct24h: number; // percent
  changePct7d: number;
  volume24h: number; // quote currency
  marketCap?: number;
  // Technical / statistical snapshot (0..100 unless noted)
  volatility: number; // annualized-ish %, e.g. 42
  momentum: number; // -100..100
  trendStrength: number; // 0..100
  rsi: number; // 0..100
  spark: number[]; // recent close series for sparkline (downsampled)
  series?: number[]; // full close series (for technical indicators)
  high52: number;
  low52: number;
  drawdown: number; // % from recent high, negative
}

export type Trend = "bullish" | "bearish" | "neutral";
export type Confidence = "low" | "moderate" | "elevated";

export interface KeyLevel {
  type: "support" | "resistance" | "pivot";
  price: number;
  note: string;
}

export interface Scenario {
  kind: Trend;
  title: string;
  probabilityLabel: string; // qualitative, never a guarantee
  conditions: string[];
  watchLevels: string[];
  invalidation: string;
  favorable: string[];
  unfavorable: string[];
}

export interface AiAnalysis {
  symbol: string;
  generatedAt: string;
  // Observed data (facts)
  observed: { label: string; value: string }[];
  // Interpretation (opinion, clearly separated)
  context: string;
  trend: { direction: Trend; strength: Confidence; note: string };
  momentum: { reading: string; note: string };
  volatility: { reading: string; note: string };
  keyLevels: KeyLevel[];
  scenarios: Scenario[];
  riskFactors: string[];
  summary: string;
}

export interface ScannerRow {
  asset: Asset;
  matchedSignals: string[];
}
