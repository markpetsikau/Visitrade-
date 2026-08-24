import type { Asset } from "@/lib/types";
import { downsample } from "./indicators";

// Deterministic pseudo-random (seeded) so sparklines are stable
// between server render and client hydration — no hydration mismatch.
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function makeSpark(seed: number, base: number, drift: number, points = 32): number[] {
  const rnd = seeded(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    const noise = (rnd() - 0.5) * base * 0.02;
    v = v + noise + (drift * base) / points;
    out.push(Number(v.toFixed(base < 1 ? 4 : 2)));
  }
  return out;
}

// symbol seed helper
function seedOf(sym: string): number {
  return sym.split("").reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
}

interface Seed {
  symbol: string;
  name: string;
  class: Asset["class"];
  price: number;
  changePct24h: number;
  changePct7d: number;
  volume24h: number;
  marketCap?: number;
  volatility: number;
  momentum: number;
  trendStrength: number;
  rsi: number;
  high52: number;
  low52: number;
  drawdown: number;
}

// ── Focus: Crypto + Indices/Commodities (per validated scope) ──
const seeds: Seed[] = [
  // Crypto
  { symbol: "BTC", name: "Bitcoin", class: "crypto", price: 64820, changePct24h: 2.31, changePct7d: 6.4, volume24h: 38_400_000_000, marketCap: 1_278_000_000_000, volatility: 46, momentum: 38, trendStrength: 72, rsi: 61, high52: 73800, low52: 38500, drawdown: -12.2 },
  { symbol: "ETH", name: "Ethereum", class: "crypto", price: 3412, changePct24h: 1.12, changePct7d: 4.1, volume24h: 17_900_000_000, marketCap: 410_000_000_000, volatility: 52, momentum: 24, trendStrength: 58, rsi: 55, high52: 4090, low52: 2100, drawdown: -16.6 },
  { symbol: "SOL", name: "Solana", class: "crypto", price: 148.2, changePct24h: -3.42, changePct7d: -8.9, volume24h: 3_200_000_000, marketCap: 68_000_000_000, volatility: 78, momentum: -41, trendStrength: 44, rsi: 38, high52: 210, low52: 78, drawdown: -29.4 },
  { symbol: "BNB", name: "BNB", class: "crypto", price: 592, changePct24h: 0.42, changePct7d: 1.8, volume24h: 1_400_000_000, marketCap: 88_000_000_000, volatility: 41, momentum: 8, trendStrength: 51, rsi: 52, high52: 720, low52: 400, drawdown: -17.7 },
  { symbol: "XRP", name: "XRP", class: "crypto", price: 0.612, changePct24h: -1.05, changePct7d: -2.4, volume24h: 1_100_000_000, marketCap: 34_000_000_000, volatility: 58, momentum: -12, trendStrength: 40, rsi: 45, high52: 0.93, low52: 0.42, drawdown: -34.1 },
  { symbol: "ADA", name: "Cardano", class: "crypto", price: 0.451, changePct24h: 4.88, changePct7d: 9.2, volume24h: 620_000_000, marketCap: 16_000_000_000, volatility: 66, momentum: 47, trendStrength: 63, rsi: 68, high52: 0.79, low52: 0.32, drawdown: -42.9 },
  { symbol: "AVAX", name: "Avalanche", class: "crypto", price: 27.4, changePct24h: -2.11, changePct7d: -5.6, volume24h: 410_000_000, marketCap: 11_000_000_000, volatility: 74, momentum: -28, trendStrength: 46, rsi: 41, high52: 65, low52: 19, drawdown: -57.8 },
  { symbol: "DOGE", name: "Dogecoin", class: "crypto", price: 0.124, changePct24h: 6.02, changePct7d: 12.1, volume24h: 1_800_000_000, marketCap: 18_000_000_000, volatility: 88, momentum: 58, trendStrength: 60, rsi: 71, high52: 0.22, low52: 0.06, drawdown: -43.6 },

  // Indices
  { symbol: "SPX", name: "S&P 500", class: "index", price: 5431, changePct24h: 0.38, changePct7d: 1.2, volume24h: 0, volatility: 14, momentum: 22, trendStrength: 68, rsi: 59, high52: 5510, low52: 4103, drawdown: -1.4 },
  { symbol: "NDX", name: "Nasdaq 100", class: "index", price: 19210, changePct24h: 0.71, changePct7d: 2.3, volume24h: 0, volatility: 18, momentum: 34, trendStrength: 71, rsi: 62, high52: 19700, low52: 14200, drawdown: -2.5 },
  { symbol: "DJI", name: "Dow Jones", class: "index", price: 38740, changePct24h: -0.12, changePct7d: 0.4, volume24h: 0, volatility: 12, momentum: 9, trendStrength: 55, rsi: 51, high52: 40000, low52: 32300, drawdown: -3.2 },
  { symbol: "DAX", name: "DAX 40", class: "index", price: 18320, changePct24h: 0.21, changePct7d: -0.6, volume24h: 0, volatility: 15, momentum: -6, trendStrength: 49, rsi: 47, high52: 18900, low52: 14600, drawdown: -3.1 },
  { symbol: "VIX", name: "Volatility Index", class: "index", price: 13.4, changePct24h: -4.2, changePct7d: -9.1, volume24h: 0, volatility: 90, momentum: -35, trendStrength: 30, rsi: 34, high52: 65, low52: 11.8, drawdown: -79.4 },

  // Commodities
  { symbol: "XAU", name: "Gold", class: "commodity", price: 2338, changePct24h: 0.64, changePct7d: 1.9, volume24h: 0, volatility: 13, momentum: 26, trendStrength: 66, rsi: 60, high52: 2450, low52: 1810, drawdown: -4.6 },
  { symbol: "XAG", name: "Silver", class: "commodity", price: 29.6, changePct24h: 1.42, changePct7d: 3.8, volume24h: 0, volatility: 24, momentum: 33, trendStrength: 62, rsi: 63, high52: 32.5, low52: 20.1, drawdown: -8.9 },
  { symbol: "WTI", name: "Crude Oil (WTI)", class: "commodity", price: 78.4, changePct24h: -1.88, changePct7d: -3.2, volume24h: 0, volatility: 32, momentum: -22, trendStrength: 43, rsi: 42, high52: 95, low52: 67, drawdown: -17.5 },
  { symbol: "NG", name: "Natural Gas", class: "commodity", price: 2.71, changePct24h: 3.15, changePct7d: 7.4, volume24h: 0, volatility: 68, momentum: 41, trendStrength: 57, rsi: 66, high52: 3.6, low52: 1.5, drawdown: -24.7 },
  { symbol: "HG", name: "Copper", class: "commodity", price: 4.52, changePct24h: 0.89, changePct7d: 2.1, volume24h: 0, volatility: 22, momentum: 19, trendStrength: 60, rsi: 58, high52: 5.1, low52: 3.6, drawdown: -11.4 },
];

export const MOCK_ASSETS: Asset[] = seeds.map((s) => {
  const series = makeSpark(seedOf(s.symbol), s.price, s.changePct7d / 100, 120);
  return { ...s, series, spark: downsample(series, 32) };
});

export const MOCK_ASSET_MAP: Record<string, Asset> = Object.fromEntries(
  MOCK_ASSETS.map((a) => [a.symbol, a]),
);
