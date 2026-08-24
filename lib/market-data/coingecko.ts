// ─────────────────────────────────────────────────────────────
// CoinGeckoProvider — live crypto (the whole market) via the free API.
//
// Fetches the top cryptos by market cap dynamically (not a fixed list),
// with real logos. Indices & commodities stay mock. Any error falls back
// to the mock crypto set. Free API, no key. One cached request per list.
// ─────────────────────────────────────────────────────────────

import type { Asset, AssetClass } from "@/lib/types";
import type { MarketDataProvider } from "./provider";
import { MOCK_ASSETS, MOCK_ASSET_MAP } from "./mock-assets";
import { fetchMarketQuotes } from "./yahoo";
import {
  computeRSI,
  computeVolatility,
  computeMomentum,
  computeTrendStrength,
  downsample,
} from "./indicators";

// How many cryptos to pull (top N by market cap). 250 = one request.
const TOP_N = 250;

interface CgMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency: number | null;
  total_volume: number;
  market_cap: number;
  ath: number;
  atl: number;
  ath_change_percentage: number | null;
  sparkline_in_7d?: { price: number[] };
}

function toAsset(m: CgMarket): Asset {
  const series = m.sparkline_in_7d?.price ?? [];
  const changePct24h = m.price_change_percentage_24h ?? 0;
  const changePct7d = m.price_change_percentage_7d_in_currency ?? 0;
  const rsi = series.length ? computeRSI(series) : 50;
  const volatility = series.length ? computeVolatility(series) : 40;
  return {
    symbol: m.symbol.toUpperCase(),
    name: m.name,
    class: "crypto",
    image: m.image,
    id: m.id,
    price: m.current_price,
    changePct24h,
    changePct7d,
    volume24h: m.total_volume ?? 0,
    marketCap: m.market_cap ?? undefined,
    volatility,
    momentum: computeMomentum(changePct7d, rsi),
    trendStrength: computeTrendStrength(changePct7d, rsi),
    rsi,
    spark: series.length ? downsample(series, 32) : [m.current_price, m.current_price],
    series: series.length ? series : [m.current_price, m.current_price],
    high52: m.ath ?? m.current_price,
    low52: m.atl ?? m.current_price,
    drawdown: m.ath_change_percentage ?? 0,
  };
}

export class CoinGeckoProvider implements MarketDataProvider {
  readonly source = "CoinGecko — tout le marché crypto (live) + mock (indices/matières premières)";
  readonly isLive = true;

  private async fetchCryptos(): Promise<Asset[]> {
    const url =
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd` +
      `&order=market_cap_desc&per_page=${TOP_N}&page=1&sparkline=true` +
      `&price_change_percentage=24h,7d`;
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = (await res.json()) as CgMarket[];
      // Dedupe by symbol, keeping the highest-cap one (list is cap-desc).
      const seen = new Set<string>();
      const out: Asset[] = [];
      for (const m of data) {
        const sym = m.symbol.toUpperCase();
        if (seen.has(sym)) continue;
        seen.add(sym);
        out.push(toAsset(m));
      }
      return out;
    } catch {
      return MOCK_ASSETS.filter((a) => a.class === "crypto"); // fallback
    }
  }

  // Real indices/commodities quotes (Stooq), anchored onto the mock series.
  private async nonCrypto(): Promise<Asset[]> {
    const base = MOCK_ASSETS.filter((a) => a.class !== "crypto");
    const quotes = await fetchMarketQuotes();
    return base.map((a) => {
      const q = quotes[a.symbol];
      if (!q) return a;
      // Prefer the real close series; else anchor the mock shape to the real price.
      if (q.series && q.series.length > 5) {
        const hi = Math.max(...q.series);
        const lo = Math.min(...q.series);
        return {
          ...a,
          price: q.price,
          changePct24h: q.change24h,
          series: q.series,
          spark: downsample(q.series, 32),
          high52: Math.max(a.high52, hi),
          low52: Math.min(a.low52, lo),
        };
      }
      const last = a.series?.[a.series.length - 1] ?? a.price;
      const scale = last > 0 ? q.price / last : 1;
      return {
        ...a,
        price: q.price,
        changePct24h: q.change24h,
        series: a.series?.map((v) => v * scale),
        spark: a.spark.map((v) => v * scale),
      };
    });
  }

  async listAssets(filter?: { class?: AssetClass }): Promise<Asset[]> {
    if (filter?.class && filter.class !== "crypto") {
      return (await this.nonCrypto()).filter((a) => a.class === filter.class);
    }
    const cryptos = await this.fetchCryptos();
    if (filter?.class === "crypto") return cryptos;
    return [...cryptos, ...(await this.nonCrypto())];
  }

  async getAsset(symbol: string): Promise<Asset | null> {
    const s = symbol.toUpperCase();
    // Mock (indices / commodities) take priority for their symbols.
    if (MOCK_ASSET_MAP[s] && MOCK_ASSET_MAP[s].class !== "crypto") {
      const list = await this.nonCrypto();
      return list.find((a) => a.symbol === s) ?? MOCK_ASSET_MAP[s];
    }
    const cryptos = await this.fetchCryptos();
    return cryptos.find((a) => a.symbol === s) ?? MOCK_ASSET_MAP[s] ?? null;
  }

  async search(query: string): Promise<Asset[]> {
    const all = await this.listAssets();
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (a) =>
        a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );
  }
}
